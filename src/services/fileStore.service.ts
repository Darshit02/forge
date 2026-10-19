import fs from "node:fs/promises";
import fsSync from "node:fs";
import path from "node:path";
import AdmZip from "adm-zip";
import { env } from "../config/env.js";
import { CONSTANTS } from "../config/constants.js";
import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
} from "../utils/errors.js";
import type { FileContent, FileTreeNode } from "../types/index.js";
import { logger } from "../utils/logger.js";

export class FileStoreService {
  private customWorkspaces = new Map<string, string>();

  /**
   * Registers a custom workspace directory for a project
   */
  setWorkspaceDir(projectId: string, dir: string): void {
    this.customWorkspaces.set(projectId, path.resolve(dir));
  }

  /**
   * Preloads custom workspace paths from DB on startup
   */
  async loadWorkspacesFromDb(): Promise<void> {
    try {
      const { db } = await import("../db/client.js");
      const { projects } = await import("../db/schema.js");
      const rows = await db
        .select({ id: projects.id, workspacePath: projects.workspacePath })
        .from(projects);
      for (const row of rows) {
        if (row.workspacePath) {
          this.setWorkspaceDir(row.id, row.workspacePath);
        }
      }
      logger.info({ count: rows.length }, "Loaded project workspace locations");
    } catch (err: any) {
      logger.warn({ err: err.message }, "Could not preload workspaces from DB");
    }
  }

  /**
   * Returns the base workspace directory for a project
   */
  getWorkspaceDir(projectId: string): string {
    const custom = this.customWorkspaces.get(projectId);
    if (custom) return custom;
    return path.resolve(env.PROJECTS_ROOT, projectId, "workspace");
  }

  /**
   * Ensures the project workspace directory exists on host FS
   */
  async initWorkspace(projectId: string): Promise<string> {
    const dir = this.getWorkspaceDir(projectId);
    await fs.mkdir(dir, { recursive: true, mode: 0o755 });
    return dir;
  }

  /**
   * Completely removes the project workspace directory from host FS
   */
  async deleteWorkspace(projectId: string): Promise<void> {
    const projectDir = this.getWorkspaceDir(projectId);
    const custom = this.customWorkspaces.get(projectId);
    this.customWorkspaces.delete(projectId);

    try {
      if (custom) {
        await fs.rm(custom, { recursive: true, force: true });
      } else {
        const rootProjectDir = path.resolve(env.PROJECTS_ROOT, projectId);
        await fs.rm(rootProjectDir, { recursive: true, force: true });
      }
      logger.info({ projectId, projectDir }, "Project workspace directory removed");
    } catch (err) {
      logger.error({ projectId, err }, "Failed to remove project directory");
    }
  }

  /**
   * Sanitizes relative path and validates that target is strictly inside workspace root
   */
  resolveSafePath(projectId: string, userRelPath: string): string {
    if (!userRelPath || typeof userRelPath !== "string") {
      throw new BadRequestError("File path must be a non-empty string");
    }

    // Reject dangerous directory traversal characters
    if (userRelPath.includes("..") || userRelPath.includes("\0")) {
      throw new ForbiddenError(
        "Invalid file path: path traversal is not permitted"
      );
    }

    const workspaceDir = this.getWorkspaceDir(projectId);
    // Normalize path and remove leading slashes
    const cleanRelPath = path.normalize(userRelPath).replace(/^[/\\]+/, "");
    const resolvedPath = path.resolve(workspaceDir, cleanRelPath);

    // Verify resolved path starts with workspace directory
    if (!resolvedPath.startsWith(workspaceDir)) {
      throw new ForbiddenError("Path escapes workspace boundary");
    }

    return resolvedPath;
  }

  /**
   * Converts absolute path inside workspace to relative path
   */
  getRelativePath(projectId: string, absolutePath: string): string {
    const workspaceDir = this.getWorkspaceDir(projectId);
    return path.relative(workspaceDir, absolutePath);
  }

  /**
   * Writes content to a file in the project workspace
   * Enforces 2 MB max file size limit
   */
  async writeFile(
    projectId: string,
    relPath: string,
    content: string | Buffer
  ): Promise<FileContent> {
    const fullPath = this.resolveSafePath(projectId, relPath);
    const contentBuffer = Buffer.isBuffer(content)
      ? content
      : Buffer.from(content, "utf8");

    if (contentBuffer.length > CONSTANTS.LIMITS.MAX_FILE_SIZE_BYTES) {
      throw new BadRequestError(
        `File size exceeds maximum permitted limit of ${
          CONSTANTS.LIMITS.MAX_FILE_SIZE_BYTES / (1024 * 1024)
        } MB`
      );
    }

    // Ensure parent directory exists
    const parentDir = path.dirname(fullPath);
    await fs.mkdir(parentDir, { recursive: true });

    // Write file
    await fs.writeFile(fullPath, contentBuffer);
    const stat = await fs.stat(fullPath);

    return {
      path: this.getRelativePath(projectId, fullPath),
      content: contentBuffer.toString("utf8"),
      size: stat.size,
      updatedAt: stat.mtime,
    };
  }

  /**
   * Reads a file from the project workspace
   */
  async readFile(projectId: string, relPath: string): Promise<FileContent> {
    const fullPath = this.resolveSafePath(projectId, relPath);

    try {
      const stat = await fs.stat(fullPath);
      if (stat.isDirectory()) {
        throw new BadRequestError("Requested path is a directory, not a file");
      }

      if (stat.size > CONSTANTS.LIMITS.MAX_FILE_SIZE_BYTES) {
        throw new BadRequestError(
          "File is too large to load into editor (exceeds 2 MB)"
        );
      }

      const content = await fs.readFile(fullPath, "utf8");
      return {
        path: this.getRelativePath(projectId, fullPath),
        content,
        size: stat.size,
        updatedAt: stat.mtime,
      };
    } catch (err: any) {
      if (err instanceof BadRequestError) throw err;
      if (err.code === "ENOENT") {
        throw new NotFoundError(`File '${relPath}' does not exist`);
      }
      throw err;
    }
  }

  /**
   * Deletes a file or directory from workspace
   */
  async deleteFile(projectId: string, relPath: string): Promise<void> {
    const fullPath = this.resolveSafePath(projectId, relPath);
    const workspaceDir = this.getWorkspaceDir(projectId);

    if (fullPath === workspaceDir) {
      throw new ForbiddenError("Cannot delete project workspace root directory");
    }

    try {
      const stat = await fs.stat(fullPath);
      if (stat.isDirectory()) {
        await fs.rm(fullPath, { recursive: true, force: true });
      } else {
        await fs.unlink(fullPath);
      }
    } catch (err: any) {
      if (err.code === "ENOENT") {
        throw new NotFoundError(`Path '${relPath}' not found`);
      }
      throw err;
    }
  }

  /**
   * Recursively lists file tree of project workspace
   */
  async listTree(
    projectId: string,
    subRelPath = ""
  ): Promise<FileTreeNode[]> {
    const targetDir = subRelPath
      ? this.resolveSafePath(projectId, subRelPath)
      : this.getWorkspaceDir(projectId);

    // If workspace directory does not exist yet, create it
    if (!fsSync.existsSync(targetDir)) {
      await this.initWorkspace(projectId);
    }

    return this.buildTree(projectId, targetDir, 0);
  }

  private async buildTree(
    projectId: string,
    currentDir: string,
    depth: number
  ): Promise<FileTreeNode[]> {
    if (depth > CONSTANTS.LIMITS.MAX_FILE_TREE_DEPTH) {
      return [];
    }

    try {
      const entries = await fs.readdir(currentDir, { withFileTypes: true });
      const nodes: FileTreeNode[] = [];

      for (const entry of entries) {
        const name = entry.name;

        // Skip ignored directories & dotfiles
        if (
          name.startsWith(".") ||
          name === "node_modules" ||
          name === "__pycache__" ||
          name === "venv" ||
          name === ".venv" ||
          name === "target" ||
          name === "dist" ||
          name === "build"
        ) {
          continue;
        }

        const fullPath = path.join(currentDir, name);
        const relPath = this.getRelativePath(projectId, fullPath);

        if (entry.isDirectory()) {
          const children = await this.buildTree(projectId, fullPath, depth + 1);
          nodes.push({
            name,
            path: relPath,
            type: "directory",
            children,
          });
        } else if (entry.isFile()) {
          let size = 0;
          try {
            const stat = await fs.stat(fullPath);
            size = stat.size;
          } catch {
            // ignore stat failure
          }

          nodes.push({
            name,
            path: relPath,
            type: "file",
            size,
          });
        }
      }

      // Sort: directories first, then alphabetically
      nodes.sort((a, b) => {
        if (a.type !== b.type) {
          return a.type === "directory" ? -1 : 1;
        }
        return a.name.localeCompare(b.name);
      });

      return nodes;
    } catch (err) {
      logger.error({ currentDir, err }, "Error reading directory tree");
      return [];
    }
  }

  /**
   * Safely extracts a ZIP buffer into workspace directory, preventing Zip Slip
   */
  async extractZip(projectId: string, zipBuffer: Buffer): Promise<number> {
    if (zipBuffer.length > CONSTANTS.LIMITS.MAX_UPLOAD_ZIP_BYTES) {
      throw new BadRequestError(
        `Uploaded zip file exceeds ${
          CONSTANTS.LIMITS.MAX_UPLOAD_ZIP_BYTES / (1024 * 1024)
        } MB limit`
      );
    }

    const workspaceDir = await this.initWorkspace(projectId);
    const zip = new AdmZip(zipBuffer);
    const zipEntries = zip.getEntries();
    let extractedCount = 0;

    for (const entry of zipEntries) {
      const entryName = entry.entryName;

      // Zip Slip protection: ensure entry does not escape workspace directory
      if (entryName.includes("..") || entryName.includes("\0")) {
        continue;
      }

      const targetPath = path.resolve(workspaceDir, entryName);
      if (!targetPath.startsWith(workspaceDir)) {
        continue; // skip malicious paths
      }

      if (entry.isDirectory) {
        await fs.mkdir(targetPath, { recursive: true });
      } else {
        await fs.mkdir(path.dirname(targetPath), { recursive: true });
        const data = entry.getData();
        if (data.length <= CONSTANTS.LIMITS.MAX_FILE_SIZE_BYTES) {
          await fs.writeFile(targetPath, data);
          extractedCount++;
        }
      }
    }

    return extractedCount;
  }

  /**
   * Collects all workspace files as a flat map of relative path -> content
   * Used for passing workspace context to AI
   */
  async getAllWorkspaceFiles(
    projectId: string,
    maxTotalBytes = 500 * 1024
  ): Promise<Array<{ path: string; content: string }>> {
    const workspaceDir = this.getWorkspaceDir(projectId);
    if (!fsSync.existsSync(workspaceDir)) {
      return [];
    }

    const files: Array<{ path: string; content: string }> = [];
    let accumulatedBytes = 0;

    const traverse = async (dir: string) => {
      if (files.length >= CONSTANTS.LIMITS.MAX_CONTEXT_FILES) return;
      const entries = await fs.readdir(dir, { withFileTypes: true });

      for (const entry of entries) {
        if (files.length >= CONSTANTS.LIMITS.MAX_CONTEXT_FILES) break;
        if (
          entry.name.startsWith(".") ||
          entry.name === "node_modules" ||
          entry.name === "__pycache__" ||
          entry.name === "venv" ||
          entry.name === ".venv"
        ) {
          continue;
        }

        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          await traverse(full);
        } else if (entry.isFile()) {
          try {
            const stat = await fs.stat(full);
            if (
              stat.size <= CONSTANTS.LIMITS.MAX_CONTEXT_FILE_SIZE_BYTES &&
              accumulatedBytes + stat.size <= maxTotalBytes
            ) {
              const content = await fs.readFile(full, "utf8");
              files.push({
                path: this.getRelativePath(projectId, full),
                content,
              });
              accumulatedBytes += stat.size;
            }
          } catch {
            // ignore unreadable/binary files
          }
        }
      }
    };

    await traverse(workspaceDir);
    return files;
  }
}

export const fileStoreService = new FileStoreService();

import { eq, and, desc } from "drizzle-orm";
import { simpleGit } from "simple-git";
import { db } from "../db/client.js";
import { collections, projects } from "../db/schema.js";
import { fileStoreService } from "./fileStore.service.js";
import { scaffoldService } from "./scaffold.service.js";
import { dockerService } from "./docker.service.js";
import { watcherService } from "./watcher.service.js";
import { specExtractorService } from "./specExtractor.service.js";
import { BadRequestError, NotFoundError } from "../utils/errors.js";
import { logger } from "../utils/logger.js";
import type { ProjectFramework, ProjectLanguage } from "../types/index.js";

export interface CreateProjectInput {
  userId: string;
  name: string;
  description?: string;
  language: ProjectLanguage;
  framework: ProjectFramework;
  aiProviderId?: string;
  source: "scratch" | "import";
  importSource?:
    | { type: "git"; url: string }
    | { type: "zip"; zipBuffer: Buffer }
    | { type: "template"; templateId: ProjectFramework };
}

export class ProjectService {
  /**
   * Creates a new project, initializes workspace, and populates starter files
   */
  async createProject(input: CreateProjectInput) {
    scaffoldService.validateFramework(input.language, input.framework);

    // 1. Insert project record to get ID
    const [project] = await db
      .insert(projects)
      .values({
        userId: input.userId,
        name: input.name.trim(),
        description: input.description?.trim() || null,
        language: input.language,
        framework: input.framework,
        workspacePath: "", // populated below
        aiProviderId: input.aiProviderId || null,
        status: "stopped",
      })
      .returning();

    const workspaceDir = fileStoreService.getWorkspaceDir(project.id);

    // Update workspace path in DB
    await db
      .update(projects)
      .set({ workspacePath: workspaceDir })
      .where(eq(projects.id, project.id));

    project.workspacePath = workspaceDir;

    // 2. Initialize workspace files according to source
    try {
      if (input.source === "scratch") {
        await scaffoldService.scaffoldProject(
          project.id,
          input.language,
          input.framework
        );
      } else if (input.source === "import" && input.importSource) {
        if (input.importSource.type === "git") {
          await this.importGit(project.id, input.importSource.url);
        } else if (input.importSource.type === "zip") {
          await fileStoreService.extractZip(
            project.id,
            input.importSource.zipBuffer
          );
        } else if (input.importSource.type === "template") {
          await scaffoldService.scaffoldProject(
            project.id,
            input.language,
            input.importSource.templateId
          );
        }
      } else {
        // Default to scaffolding if unspecified
        await scaffoldService.scaffoldProject(
          project.id,
          input.language,
          input.framework
        );
      }

      // 3. Create default collection for tester
      await db.insert(collections).values({
        projectId: project.id,
        name: "Default",
        orderIndex: 0,
      });

      // 4. Initial AST spec extraction
      try {
        await specExtractorService.extractAndSync(project.id);
      } catch (specErr: any) {
        logger.warn(
          { projectId: project.id, err: specErr.message },
          "Initial spec extraction completed with notice"
        );
      }

      logger.info({ projectId: project.id }, "Project created successfully");
      return project;
    } catch (err: any) {
      // Clean up failed workspace
      await fileStoreService.deleteWorkspace(project.id);
      await db.delete(projects).where(eq(projects.id, project.id));
      throw new BadRequestError(`Failed to initialize project: ${err.message}`);
    }
  }

  /**
   * Imports a git repository into the project workspace
   */
  private async importGit(projectId: string, gitUrl: string): Promise<void> {
    const workspaceDir = await fileStoreService.initWorkspace(projectId);
    try {
      const git = simpleGit();
      logger.info({ projectId, gitUrl }, "Cloning git repository into workspace");
      await git.clone(gitUrl, workspaceDir, ["--depth", "1"]);
      logger.info({ projectId }, "Git repository cloned successfully");
    } catch (err: any) {
      throw new BadRequestError(
        `Failed to clone repository from '${gitUrl}': ${err.message}`
      );
    }
  }

  /**
   * Lists all projects belonging to a user
   */
  async listUserProjects(userId: string) {
    return db
      .select()
      .from(projects)
      .where(eq(projects.userId, userId))
      .orderBy(desc(projects.createdAt));
  }

  /**
   * Gets project by ID
   */
  async getProject(projectId: string) {
    const [project] = await db
      .select()
      .from(projects)
      .where(eq(projects.id, projectId))
      .limit(1);

    if (!project) {
      throw new NotFoundError(`Project ${projectId} not found`);
    }

    return project;
  }

  /**
   * Updates project metadata
   */
  async updateProject(
    projectId: string,
    updates: {
      name?: string;
      description?: string;
      aiProviderId?: string | null;
    }
  ) {
    const [updated] = await db
      .update(projects)
      .set({
        ...(updates.name ? { name: updates.name.trim() } : {}),
        ...(updates.description !== undefined
          ? { description: updates.description?.trim() || null }
          : {}),
        ...(updates.aiProviderId !== undefined
          ? { aiProviderId: updates.aiProviderId }
          : {}),
        updatedAt: new Date(),
      })
      .where(eq(projects.id, projectId))
      .returning();

    return updated;
  }

  /**
   * Deletes a project, cleans up containers, watchers, and host workspace
   */
  async deleteProject(projectId: string): Promise<void> {
    // 1. Stop container if running
    try {
      await dockerService.stopProject(projectId);
    } catch {
      // ignore container stop errors on deletion
    }

    // 2. Stop file watcher
    await watcherService.stopWatcher(projectId);

    // 3. Remove files from host filesystem
    await fileStoreService.deleteWorkspace(projectId);

    // 4. Delete DB record (foreign keys cascade)
    await db.delete(projects).where(eq(projects.id, projectId));

    logger.info({ projectId }, "Project deleted and resources purged");
  }
}

export const projectService = new ProjectService();

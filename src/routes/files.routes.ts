import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { requireAuth, requireProjectOwner } from "../middleware/auth.js";
import { fileStoreService } from "../services/fileStore.service.js";
import { projectService } from "../services/project.service.js";
import { wsHub } from "../ws/hub.js";
import { BadRequestError } from "../utils/errors.js";

import {
  WriteFileRequestSchema,
  DeleteFileRequestSchema,
} from "@forge/shared";

export const filesRoutes = new Hono();

filesRoutes.use("*", requireAuth);

/**
 * GET /api/projects/:id/files - Tree listing (?path=/)
 */
filesRoutes.get("/:id/files", requireProjectOwner, async (c) => {
  const projectId = c.req.param("id")!;
  const subPath = c.req.query("path") || "";

  const tree = await fileStoreService.listTree(projectId, subPath);
  return c.json({ tree });
});

/**
 * GET /api/projects/:id/files/content - Read single file content (?path=main.py)
 */
filesRoutes.get("/:id/files/content", requireProjectOwner, async (c) => {
  const projectId = c.req.param("id")!;
  const filePath = c.req.query("path");

  if (!filePath) {
    throw new BadRequestError("Query parameter 'path' is required");
  }

  const file = await fileStoreService.readFile(projectId, filePath);
  return c.json({ file });
});

/**
 * PUT /api/projects/:id/files/content and /api/projects/:id/files - Write file content ({ path, content })
 */
const handleWriteFile = async (c: any) => {
  const projectId = c.req.param("id")!;
  const { path: filePath, content } = c.req.valid("json");

  const written = await fileStoreService.writeFile(
    projectId,
    filePath,
    content
  );

  // Notify connected WebSocket clients
  wsHub.broadcastFileChanged(projectId, written.path, written.content);

  return c.json({ file: written });
};

filesRoutes.put(
  "/:id/files/content",
  requireProjectOwner,
  zValidator("json", WriteFileRequestSchema),
  handleWriteFile
);

filesRoutes.put(
  "/:id/files",
  requireProjectOwner,
  zValidator("json", WriteFileRequestSchema),
  handleWriteFile
);

/**
 * DELETE /api/projects/:id/files - Delete file or directory ({ path })
 */
filesRoutes.delete(
  "/:id/files",
  requireProjectOwner,
  zValidator("json", DeleteFileRequestSchema),
  async (c) => {
    const projectId = c.req.param("id")!;
    const { path: filePath } = c.req.valid("json");

    await fileStoreService.deleteFile(projectId, filePath);

    // Notify connected clients
    wsHub.broadcastFileChanged(projectId, filePath, undefined);

    return c.json({ ok: true, path: filePath });
  }
);

/**
 * POST /api/projects/:id/files/upload - Multipart upload (e.g. zip import)
 */
filesRoutes.post("/:id/files/upload", requireProjectOwner, async (c) => {
  const projectId = c.req.param("id")!;
  const body = await c.req.parseBody();

  const file = body["file"];
  if (!file || typeof file === "string") {
    throw new BadRequestError("A valid file upload is required (multipart field 'file')");
  }

  const arrayBuffer = await (file as Blob).arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const extractedCount = await fileStoreService.extractZip(projectId, buffer);

  // Notify clients
  wsHub.broadcastFileChanged(projectId, "/");

  return c.json({ ok: true, extractedFiles: extractedCount });
});

/**
 * GET /api/projects/:id/files/download & /api/projects/:id/download
 * Export project workspace as a ZIP archive
 */
const handleDownloadProject = async (c: any) => {
  const projectId = c.req.param("id")!;
  const project = await projectService.getProject(projectId);
  const zipBuffer = await fileStoreService.createZip(projectId);

  const safeName = (project.name || "project")
    .replace(/[^a-zA-Z0-9_-]/g, "_")
    .toLowerCase();
  const filename = `${safeName}.zip`;

  c.header("Content-Type", "application/zip");
  c.header("Content-Disposition", `attachment; filename="${filename}"`);
  return c.body(zipBuffer);
};

filesRoutes.get("/:id/files/download", requireProjectOwner, handleDownloadProject);
filesRoutes.get("/:id/download", requireProjectOwner, handleDownloadProject);


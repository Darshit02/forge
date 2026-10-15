import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { requireAuth, requireProjectOwner } from "../middleware/auth.js";
import { projectService } from "../services/project.service.js";
import { scaffoldService } from "../services/scaffold.service.js";
import type { ProjectFramework, ProjectLanguage } from "../types/index.js";

import {
  CreateProjectRequestSchema,
  UpdateProjectRequestSchema,
} from "@forge/shared";

export const projectsRoutes = new Hono();

projectsRoutes.use("*", requireAuth);

/**
 * GET /api/projects/templates - List available starter templates
 */
projectsRoutes.get("/templates", async (c) => {
  const templates = scaffoldService.getTemplates();
  return c.json({ templates });
});

/**
 * GET /api/projects - List user's projects
 */
projectsRoutes.get("/", async (c) => {
  const user = c.get("user");
  const userProjects = await projectService.listUserProjects(user.id);
  return c.json({ projects: userProjects });
});

/**
 * POST /api/projects - Create a new project or import
 */
projectsRoutes.post("/", zValidator("json", CreateProjectRequestSchema), async (c) => {
  const user = c.get("user");
  const body = c.req.valid("json");

  const project = await projectService.createProject({
    userId: user.id,
    name: body.name,
    description: body.description,
    language: body.language as ProjectLanguage,
    framework: body.framework as ProjectFramework,
    aiProviderId: body.aiProviderId,
    source: body.source,
    importSource: body.importSource,
  });

  return c.json({ project }, 201);
});

/**
 * GET /api/projects/:id - Get project details
 */
projectsRoutes.get("/:id", requireProjectOwner, async (c) => {
  const projectId = c.req.param("id")!;
  const project = await projectService.getProject(projectId);
  return c.json({ project });
});

/**
 * PATCH /api/projects/:id - Update project metadata
 */
projectsRoutes.patch(
  "/:id",
  requireProjectOwner,
  zValidator("json", UpdateProjectRequestSchema),
  async (c) => {
    const projectId = c.req.param("id")!;
    const body = c.req.valid("json");

    const updated = await projectService.updateProject(projectId, body);
    return c.json({ project: updated });
  }
);

/**
 * DELETE /api/projects/:id - Delete project and all associated resources
 */
projectsRoutes.delete("/:id", requireProjectOwner, async (c) => {
  const projectId = c.req.param("id")!;
  await projectService.deleteProject(projectId);
  return c.json({ ok: true, id: projectId });
});

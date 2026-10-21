import { apiClient, apiDownload } from "./client.js";
import type { Project, TemplateMetadata } from "../../types/api.js";

export const projectsApi = {
  list: () => apiClient<{ projects: Project[] }>("/api/projects"),

  get: (id: string) => apiClient<{ project: Project }>(`/api/projects/${id}`),

  templates: () =>
    apiClient<{ templates: TemplateMetadata[] }>("/api/projects/templates"),

  browseDirectories: (path?: string) =>
    apiClient<{
      currentPath: string;
      parentPath: string | null;
      homePath: string;
      forgeRoot: string;
      canWrite: boolean;
      directories: Array<{ name: string; path: string }>;
    }>(
      `/api/projects/directories${path ? `?path=${encodeURIComponent(path)}` : ""}`
    ),

  create: (data: {
    name: string;
    description?: string;
    language: string;
    framework: string;
    aiProviderId?: string;
    folderPath?: string;
    source?: "scratch" | "import";
    importSource?:
      | { type: "git"; url: string }
      | { type: "template"; templateId: string };
  }) =>
    apiClient<{ project: Project }>("/api/projects", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: (
    id: string,
    data: { name?: string; description?: string | null; aiProviderId?: string | null }
  ) =>
    apiClient<{ project: Project }>(`/api/projects/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    apiClient<{ ok: boolean; id: string }>(`/api/projects/${id}`, {
      method: "DELETE",
    }),

  download: (id: string, filename?: string) =>
    apiDownload(`/api/projects/${id}/files/download`, filename),
};

import { apiClient } from "./client.js";

export const specApi = {
  get: (projectId: string) =>
    apiClient<{ spec: Record<string, any>; fetchedAt: string }>(
      `/api/projects/${projectId}/spec`
    ),

  refresh: (projectId: string) =>
    apiClient<{ spec: Record<string, any>; refreshedAt: string }>(
      `/api/projects/${projectId}/spec/refresh`,
      { method: "POST" }
    ),
};

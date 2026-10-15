import { apiClient } from "./client.js";
import type { Environment } from "../../types/api.js";

export const environmentsApi = {
  list: (projectId: string) =>
    apiClient<{ environments: Environment[] }>(
      `/api/projects/${projectId}/environments`
    ),

  create: (
    projectId: string,
    data: {
      name: string;
      variables?: Record<string, string>;
      isActive?: boolean;
    }
  ) =>
    apiClient<{ environment: Environment }>(
      `/api/projects/${projectId}/environments`,
      {
        method: "POST",
        body: JSON.stringify(data),
      }
    ),

  update: (
    id: string,
    data: {
      name?: string;
      variables?: Record<string, string>;
      isActive?: boolean;
    }
  ) =>
    apiClient<{ environment: Environment }>(`/api/environments/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    apiClient<{ id: string }>(`/api/environments/${id}`, {
      method: "DELETE",
    }),
};

import { apiClient } from "./client.js";
import type { ContainerStatusInfo } from "../../types/api.js";

export const containersApi = {
  status: (projectId: string) =>
    apiClient<{ container: ContainerStatusInfo }>(
      `/api/projects/${projectId}/status`
    ),

  start: (projectId: string) =>
    apiClient<{ container: ContainerStatusInfo }>(
      `/api/projects/${projectId}/start`,
      { method: "POST" }
    ),

  stop: (projectId: string) =>
    apiClient<{ container: ContainerStatusInfo }>(
      `/api/projects/${projectId}/stop`,
      { method: "POST" }
    ),

  restart: (projectId: string) =>
    apiClient<{ container: ContainerStatusInfo }>(
      `/api/projects/${projectId}/restart`,
      { method: "POST" }
    ),
};

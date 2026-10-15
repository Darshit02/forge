import { apiClient } from "./client.js";
import type { APIRequest, Collection, Environment } from "../../types/api.js";

export const collectionsApi = {
  list: (projectId: string) =>
    apiClient<{ collections: Collection[] }>(
      `/api/projects/${projectId}/collections`
    ),

  createCollection: (
    projectId: string,
    data: { name: string; parentId?: string }
  ) =>
    apiClient<{ collection: Collection }>(
      `/api/projects/${projectId}/collections`,
      {
        method: "POST",
        body: JSON.stringify(data),
      }
    ),

  updateCollection: (
    id: string,
    data: { name?: string; orderIndex?: number }
  ) =>
    apiClient<{ collection: Collection }>(`/api/collections/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  deleteCollection: (id: string) =>
    apiClient<{ ok: boolean; id: string }>(`/api/collections/${id}`, {
      method: "DELETE",
    }),

  createRequest: (
    collectionId: string,
    data: {
      name: string;
      method: string;
      path: string;
      headers?: Record<string, string>;
      body?: unknown;
      authConfig?: Record<string, unknown>;
    }
  ) =>
    apiClient<{ request: APIRequest }>(`/api/collections/${collectionId}/requests`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  updateRequest: (
    id: string,
    data: {
      name?: string;
      method?: string;
      path?: string;
      headers?: Record<string, string>;
      body?: unknown;
      authConfig?: Record<string, unknown>;
    }
  ) =>
    apiClient<{ request: APIRequest }>(`/api/requests/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  deleteRequest: (id: string) =>
    apiClient<{ ok: boolean; id: string }>(`/api/requests/${id}`, {
      method: "DELETE",
    }),

  // Environments
  listEnvironments: (projectId: string) =>
    apiClient<{ environments: Environment[] }>(
      `/api/projects/${projectId}/environments`
    ),

  createEnvironment: (
    projectId: string,
    data: { name: string; variables?: Record<string, string>; isActive?: boolean }
  ) =>
    apiClient<{ environment: Environment }>(
      `/api/projects/${projectId}/environments`,
      {
        method: "POST",
        body: JSON.stringify(data),
      }
    ),

  updateEnvironment: (
    id: string,
    data: { name?: string; variables?: Record<string, string>; isActive?: boolean }
  ) =>
    apiClient<{ environment: Environment }>(`/api/environments/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  deleteEnvironment: (id: string) =>
    apiClient<{ ok: boolean; id: string }>(`/api/environments/${id}`, {
      method: "DELETE",
    }),
};

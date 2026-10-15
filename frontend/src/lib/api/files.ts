import { apiClient } from "./client.js";
import type { FileContent, FileTreeNode } from "../../types/api.js";

export const filesApi = {
  tree: (projectId: string, path = "") =>
    apiClient<{ tree: FileTreeNode[] }>(
      `/api/projects/${projectId}/files?path=${encodeURIComponent(path)}`
    ),

  read: (projectId: string, path: string) =>
    apiClient<{ file: FileContent }>(
      `/api/projects/${projectId}/files/content?path=${encodeURIComponent(path)}`
    ),

  write: (projectId: string, path: string, content: string) =>
    apiClient<{ file: FileContent }>(`/api/projects/${projectId}/files/content`, {
      method: "PUT",
      body: JSON.stringify({ path, content }),
    }),

  delete: (projectId: string, path: string) =>
    apiClient<{ ok: boolean; path: string }>(`/api/projects/${projectId}/files`, {
      method: "DELETE",
      body: JSON.stringify({ path }),
    }),

  upload: (projectId: string, file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return apiClient<{ ok: boolean; extractedFiles: number }>(
      `/api/projects/${projectId}/files/upload`,
      {
        method: "POST",
        body: formData,
      }
    );
  },
};

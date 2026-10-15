import { apiClient } from "./client.js";
import type { AIProvider } from "../../types/api.js";

export const providersApi = {
  list: () => apiClient<{ providers: AIProvider[] }>("/api/providers"),

  create: (data: {
    provider: string;
    label: string;
    apiKey: string;
    baseUrl?: string | null;
    modelDefault?: string;
  }) =>
    apiClient<{ provider: AIProvider }>("/api/providers", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: (
    id: string,
    data: {
      label?: string;
      apiKey?: string;
      baseUrl?: string | null;
      modelDefault?: string;
    }
  ) =>
    apiClient<{ provider: AIProvider }>(`/api/providers/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    apiClient<{ ok: boolean; id: string }>(`/api/providers/${id}`, {
      method: "DELETE",
    }),

  test: (id: string) =>
    apiClient<{ ok: boolean; latencyMs: number; error?: string }>(
      `/api/providers/${id}/test`,
      { method: "POST" }
    ),

  setDefault: (id: string) =>
    apiClient<{ provider: AIProvider }>(`/api/providers/${id}/default`, {
      method: "POST",
    }),
};

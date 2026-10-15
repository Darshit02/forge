import { apiClient } from "./client.js";
import type {
  TestHistoryItem,
  TestRequestPayload,
  TestResponsePayload,
} from "../../types/api.js";

export const testerApi = {
  run: (projectId: string, data: TestRequestPayload) =>
    apiClient<TestResponsePayload>(`/api/projects/${projectId}/test`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  history: (projectId: string, limit = 50) =>
    apiClient<{ history: TestHistoryItem[] }>(
      `/api/projects/${projectId}/test/history?limit=${limit}`
    ),
};

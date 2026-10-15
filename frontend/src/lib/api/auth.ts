import { apiClient } from "./client.js";
import type { AuthResponse, User } from "../../types/api.js";

export const authApi = {
  register: (data: { email: string; password: string; name?: string }) =>
    apiClient<AuthResponse>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  login: (data: { email: string; password: string }) =>
    apiClient<AuthResponse>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  refresh: () =>
    apiClient<{ user: User; accessToken: string }>("/api/auth/refresh", {
      method: "POST",
    }),

  logout: () =>
    apiClient<{ ok: boolean }>("/api/auth/logout", {
      method: "POST",
    }),

  me: () => apiClient<{ user: User }>("/api/auth/me"),
};

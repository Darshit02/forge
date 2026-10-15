import { env } from "../env.js";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public details?: unknown
  ) {
    super(message);
    this.name = "ApiError";
  }
}

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: unknown) => void;
  reject: (reason: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

export async function apiClient<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem("forge_access_token");
  const headers = new Headers(options.headers || {});

  if (!headers.has("Content-Type") && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  // Prepend base URL if not absolute
  const url = endpoint.startsWith("http")
    ? endpoint
    : `${env.VITE_API_URL}${endpoint.startsWith("/") ? "" : "/"}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: "include", // for httpOnly refresh cookies
  });

  // Handle 401 Unauthorized with token refresh retry
  if (response.status === 401 && !endpoint.includes("/api/auth/")) {
    if (!isRefreshing) {
      isRefreshing = true;

      try {
        const refreshRes = await fetch(`${env.VITE_API_URL}/api/auth/refresh`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
        });

        if (!refreshRes.ok) {
          throw new Error("Session expired");
        }

        const data = await refreshRes.json();
        const newToken = data.accessToken;
        localStorage.setItem("forge_access_token", newToken);
        processQueue(null, newToken);

        // Retry original request with new token
        headers.set("Authorization", `Bearer ${newToken}`);
        const retryRes = await fetch(url, {
          ...options,
          headers,
          credentials: "include",
        });

        return (await retryRes.json()) as T;
      } catch (refreshErr) {
        processQueue(refreshErr, null);
        localStorage.removeItem("forge_access_token");
        window.location.href = "/login";
        throw new ApiError(401, "Session expired, please log in again.");
      } finally {
        isRefreshing = false;
      }
    } else {
      // Queue requests while token is refreshing
      return new Promise<T>((resolve, reject) => {
        failedQueue.push({
          resolve: (newToken) => {
            headers.set("Authorization", `Bearer ${newToken}`);
            fetch(url, { ...options, headers, credentials: "include" })
              .then((r) => r.json())
              .then((data) => resolve(data as T))
              .catch(reject);
          },
          reject,
        });
      });
    }
  }

  if (!response.ok) {
    let errorMsg = `HTTP Error ${response.status}`;
    let details: unknown = null;
    try {
      const errJson = await response.json();
      errorMsg = errJson.error || errorMsg;
      details = errJson.details || null;
    } catch {
      // not JSON
    }
    throw new ApiError(response.status, errorMsg, details);
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return {} as T;
  }

  return (await response.json()) as T;
}

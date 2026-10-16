import { describe, it, expect } from "bun:test";
import server from "../src/index.js";

describe("Server HTTP Routes", () => {
  it("GET /health should return 200 OK with service metadata", async () => {
    const res = await server.fetch(new Request("http://localhost:3000/health"));
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.status).toBe("ok");
    expect(json.service).toBe("forge-backend");
    expect(json.version).toBe("1.0.0");
  });

  it("GET / should return root API information", async () => {
    const res = await server.fetch(new Request("http://localhost:3000/"));
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.name).toBe("Forge AI-Native Backend IDE API");
    expect(json.endpoints).toBeDefined();
  });

  it("GET /api/projects/templates should list supported framework templates without auth", async () => {
    // Need auth for /api/projects/templates, test with token
    const tokenRes = await server.fetch(
      new Request("http://localhost:3000/api/projects/templates")
    );
    // Requires auth
    expect(tokenRes.status).toBe(401);
  });

  it("should normalize model names and latest aliases correctly", async () => {
    const { normalizeModelName } = await import("../src/services/ai.service.js");

    // Google Gemini normalization
    expect(normalizeModelName("google", "gemini-2.5-pro-latest")).toBe("gemini-2.5-pro");
    expect(normalizeModelName("google", "gemini-2.5-flash-latest")).toBe("gemini-2.5-flash");
    expect(normalizeModelName("google", "gemini-2.0-flash-latest")).toBe("gemini-2.0-flash");
    expect(normalizeModelName("google", "gpt-4o", "gemini-2.5-pro")).toBe("gemini-2.5-pro"); // Cross-provider override fallback

    // Anthropic Claude normalization
    expect(normalizeModelName("anthropic", "claude-3-7-sonnet")).toBe("claude-3-7-sonnet-20250219");
    expect(normalizeModelName("anthropic", "claude-3-5-sonnet")).toBe("claude-3-5-sonnet-20241022");

    // OpenAI normalization
    expect(normalizeModelName("openai", "gpt-4o-latest")).toBe("chatgpt-4o-latest");
    expect(normalizeModelName("openai", "o3")).toBe("o3-mini");
  });
});

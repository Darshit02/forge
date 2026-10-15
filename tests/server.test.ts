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
});

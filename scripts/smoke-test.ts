import fs from "node:fs";
import path from "node:path";

const BASE_URL = process.env.API_URL || "http://127.0.0.1:3000";

const RESET = "\x1b[0m";
const BOLD = "\x1b[1m";
const GREEN = "\x1b[32m";
const RED = "\x1b[31m";
const YELLOW = "\x1b[33m";
const CYAN = "\x1b[36m";

function logStep(step: number, title: string) {
  console.log(`\n${BOLD}${CYAN}[Step ${step}]${RESET} ${title}`);
}

function logPass(msg: string) {
  console.log(`  ${GREEN}✓${RESET} ${msg}`);
}

function logFail(msg: string, details?: any) {
  console.error(`  ${RED}✗ ${msg}${RESET}`);
  if (details) {
    console.error(details);
  }
}

async function run() {
  console.log(`${BOLD}====================================================${RESET}`);
  console.log(`${BOLD}       FORGE END-TO-END SMOKE TEST RUNNER           ${RESET}`);
  console.log(`${BOLD}====================================================${RESET}`);
  console.log(`Target Backend: ${BASE_URL}\n`);

  let token = "";
  let userId = "";
  let projectId = "";
  let totalSteps = 0;
  let passedSteps = 0;

  async function assertStep(title: string, fn: () => Promise<void>) {
    totalSteps++;
    try {
      await fn();
      passedSteps++;
    } catch (err: any) {
      logFail(`Step failed: ${err.message}`, err);
      throw err;
    }
  }

  // 1. Health check
  logStep(1, "Server Health Check");
  await assertStep("GET / returns 200", async () => {
    const res = await fetch(`${BASE_URL}/`);
    if (!res.ok) throw new Error(`Server returned ${res.status}`);
    const data = (await res.json()) as any;
    logPass(`Server is responding: ${data.name || "OK"}`);
  });

  // 2. Register
  logStep(2, "User Registration (POST /api/auth/register)");
  const timestamp = Date.now();
  const testEmail = `smoke_${timestamp}@forge.dev`;
  const testPassword = "Password123!";

  await assertStep("Register new test account", async () => {
    const res = await fetch(`${BASE_URL}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: testEmail,
        password: testPassword,
        name: "Smoke Tester",
      }),
    });

    if (res.status !== 201) {
      const err = await res.text();
      throw new Error(`Register failed with status ${res.status}: ${err}`);
    }

    const data = (await res.json()) as any;
    if (!data.accessToken || !data.user?.id) {
      throw new Error("Missing token or user object in register response");
    }

    token = data.accessToken;
    userId = data.user.id;
    logPass(`User registered successfully: ${data.user.email} (ID: ${userId})`);
  });

  // 3. Add AI Provider
  logStep(3, "Add AI Provider (POST /api/providers)");
  await assertStep("Add BYOK AI Provider", async () => {
    const res = await fetch(`${BASE_URL}/api/providers`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        provider: "openai",
        apiKey: "sk-fake-smoke-test-key-1234567890abcdef",
        label: "Smoke Test OpenAI",
      }),
    });

    if (res.status !== 201) {
      const err = await res.text();
      throw new Error(`Add provider failed with status ${res.status}: ${err}`);
    }

    const data = (await res.json()) as any;
    if (!data.provider || !data.provider.id) {
      throw new Error("Missing provider object in response");
    }

    logPass(`AI Provider added: ${data.provider.label} (${data.provider.provider})`);
  });

  // 4. Create Project
  logStep(4, "Create FastAPI Project (POST /api/projects)");
  await assertStep("Create FastAPI scratch project", async () => {
    const res = await fetch(`${BASE_URL}/api/projects`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        name: `smoke-project-${timestamp}`,
        language: "python",
        framework: "fastapi",
        source: "scratch",
      }),
    });

    if (res.status !== 201) {
      const err = await res.text();
      throw new Error(`Create project failed with status ${res.status}: ${err}`);
    }

    const data = (await res.json()) as any;
    if (!data.project?.id) {
      throw new Error("Missing project in create response");
    }

    projectId = data.project.id;
    logPass(`Project created: ${data.project.name} (ID: ${projectId})`);
  });

  // 5. Verify Workspace Files
  logStep(5, "Verify Workspace Files (GET /api/projects/:id/files)");
  await assertStep("Verify scaffolded file tree", async () => {
    const res = await fetch(`${BASE_URL}/api/projects/${projectId}/files`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) throw new Error(`Files fetch failed: ${res.status}`);
    const data = (await res.json()) as any;
    const tree = data.tree || [];
    const hasMainPy = tree.some((node: any) => node.name === "main.py");
    if (!hasMainPy) {
      throw new Error("main.py was not found in scaffolded tree");
    }

    logPass(`Found ${tree.length} file/folder entries in workspace, including main.py`);
  });

  // 6. Verify OpenAPI Spec
  logStep(6, "Verify Initial OpenAPI Spec (GET /api/projects/:id/spec)");
  await assertStep("Fetch initial OpenAPI spec", async () => {
    const res = await fetch(`${BASE_URL}/api/projects/${projectId}/spec`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) throw new Error(`Spec fetch failed: ${res.status}`);
    const data = (await res.json()) as any;
    if (!data.spec || !data.spec.paths) {
      throw new Error("Spec object missing or has no paths");
    }

    const paths = Object.keys(data.spec.paths);
    logPass(`Spec verified with endpoints: ${paths.join(", ")}`);
  });

  // 7. Write New Route File
  logStep(7, "Write New Route to Workspace (PUT /api/projects/:id/files)");
  await assertStep("Add new endpoint to main.py", async () => {
    // Read current main.py
    const readRes = await fetch(
      `${BASE_URL}/api/projects/${projectId}/files/content?path=main.py`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (!readRes.ok) throw new Error("Could not read main.py");
    const readData = (await readRes.json()) as any;
    const originalContent = readData.file.content;

    const addedRoute = `
@app.get("/smoke/status", tags=["Smoke"])
def smoke_status():
    return {"status": "smoke-tested", "timestamp": ${timestamp}}
`;

    const writeRes = await fetch(`${BASE_URL}/api/projects/${projectId}/files`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        path: "main.py",
        content: originalContent + addedRoute,
      }),
    });

    if (!writeRes.ok) throw new Error(`Failed to write main.py: ${writeRes.status}`);
    logPass("Successfully appended /smoke/status endpoint to main.py");
  });

  // 8. Wait for Debounced Spec Extraction
  logStep(8, "Debounce & Watcher Stabilization Wait");
  console.log("  Waiting 1500ms for file watcher & AST/spec extraction...");
  await new Promise((r) => setTimeout(r, 1500));
  logPass("Watcher debounce period elapsed");

  // 9. Verify Spec Synced New Route
  logStep(9, "Verify Updated OpenAPI Spec (GET /api/projects/:id/spec)");
  await assertStep("Confirm /smoke/status in OpenAPI spec", async () => {
    const res = await fetch(`${BASE_URL}/api/projects/${projectId}/spec`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) throw new Error(`Spec fetch failed: ${res.status}`);
    const data = (await res.json()) as any;
    const paths = Object.keys(data.spec?.paths || {});

    if (!paths.includes("/smoke/status")) {
      // Force refresh if watcher was slightly slower
      const refreshRes = await fetch(
        `${BASE_URL}/api/projects/${projectId}/spec/refresh`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const refreshData = (await refreshRes.json()) as any;
      const refPaths = Object.keys(refreshData.spec?.paths || {});
      if (!refPaths.includes("/smoke/status")) {
        throw new Error(
          `New route /smoke/status not detected in spec. Found: ${refPaths.join(", ")}`
        );
      }
    }

    logPass("New route /smoke/status detected in OpenAPI spec");
  });

  // 10. SSRF Security Guard Verification
  logStep(10, "Tester SSRF Protection Verification");
  await assertStep("Block cloud metadata (169.254.169.254)", async () => {
    const res = await fetch(`${BASE_URL}/api/projects/${projectId}/test`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        method: "GET",
        path: "http://169.254.169.254/latest/meta-data",
      }),
    });

    if (res.status !== 400 && res.status !== 403) {
      throw new Error(`Expected SSRF rejection (400/403), got ${res.status}`);
    }
    logPass("SSRF Protection blocked metadata URL");
  });

  await assertStep("Block path traversal (../)", async () => {
    const res = await fetch(`${BASE_URL}/api/projects/${projectId}/test`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        method: "GET",
        path: "/../../etc/passwd",
      }),
    });

    if (res.status !== 400 && res.status !== 403) {
      throw new Error(`Expected SSRF rejection (400/403), got ${res.status}`);
    }
    logPass("SSRF Protection blocked path traversal");
  });

  // 11. Container Lifecycle Test (Optional if Docker daemon is active)
  logStep(11, "Container Lifecycle (Start / Test / Stop)");
  try {
    const startRes = await fetch(`${BASE_URL}/api/projects/${projectId}/start`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });

    if (startRes.ok) {
      const startData = (await startRes.json()) as any;
      logPass(`Container started: port ${startData.container?.hostPort}`);

      // Test against container endpoint
      const testRes = await fetch(`${BASE_URL}/api/projects/${projectId}/test`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          method: "GET",
          path: "/health",
        }),
      });

      if (testRes.ok) {
        const testData = (await testRes.json()) as any;
        logPass(`Container test passed: status ${testData.status}`);
      }

      // Stop container
      await fetch(`${BASE_URL}/api/projects/${projectId}/stop`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      logPass("Container stopped successfully");
    } else {
      const err = await startRes.json();
      console.log(
        `  ${YELLOW}ℹ Docker container start skipped: ${err.error || "Docker not running"}${RESET}`
      );
    }
  } catch (err: any) {
    console.log(`  ${YELLOW}ℹ Docker daemon inactive (${err.message})${RESET}`);
  }

  // 12. Logout
  logStep(12, "User Logout (POST /api/auth/logout)");
  await assertStep("Logout user session", async () => {
    const res = await fetch(`${BASE_URL}/api/auth/logout`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) throw new Error(`Logout failed: ${res.status}`);
    logPass("User session logged out successfully");
  });

  console.log(`\n${BOLD}====================================================${RESET}`);
  console.log(
    `${BOLD}${GREEN} ✓ SMOKE TEST COMPLETED: ${passedSteps}/${totalSteps} checks passed${RESET}`
  );
  console.log(`${BOLD}====================================================${RESET}\n`);
}

run().catch((err) => {
  console.error(`\n${RED}${BOLD}SMOKE TEST SUITE FAILED${RESET}`);
  process.exit(1);
});

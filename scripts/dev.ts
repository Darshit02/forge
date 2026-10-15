import { spawn } from "node:child_process";

console.log("🚀 Starting Forge Dev Environment (Backend + Frontend)...");

// Colors for terminal output
const RESET = "\x1b[0m";
const BLUE = "\x1b[34m";
const GREEN = "\x1b[32m";
const GRAY = "\x1b[90m";

// Spawn backend
const backend = spawn("bun", ["--watch", "src/index.ts"], {
  stdio: ["inherit", "pipe", "pipe"],
  shell: true,
  env: { ...process.env, FORCE_COLOR: "1" },
});

backend.stdout.on("data", (data) => {
  const lines = data.toString().trimEnd().split("\n");
  for (const line of lines) {
    console.log(`${BLUE}[backend]${RESET} ${line}`);
  }
});

backend.stderr.on("data", (data) => {
  const lines = data.toString().trimEnd().split("\n");
  for (const line of lines) {
    console.error(`${BLUE}[backend]${RESET} ${line}`);
  }
});

// Spawn frontend
const frontend = spawn("bun", ["run", "--cwd", "frontend", "dev"], {
  stdio: ["inherit", "pipe", "pipe"],
  shell: true,
  env: { ...process.env, FORCE_COLOR: "1" },
});

frontend.stdout.on("data", (data) => {
  const lines = data.toString().trimEnd().split("\n");
  for (const line of lines) {
    console.log(`${GREEN}[frontend]${RESET} ${line}`);
  }
});

frontend.stderr.on("data", (data) => {
  const lines = data.toString().trimEnd().split("\n");
  for (const line of lines) {
    console.error(`${GREEN}[frontend]${RESET} ${line}`);
  }
});

function cleanup() {
  console.log(`\n${GRAY}Shutting down Forge dev processes...${RESET}`);
  backend.kill("SIGTERM");
  frontend.kill("SIGTERM");
  process.exit(0);
}

process.on("SIGINT", cleanup);
process.on("SIGTERM", cleanup);

backend.on("close", (code) => {
  if (code !== 0 && code !== null) {
    console.error(`${BLUE}[backend]${RESET} exited with code ${code}`);
  }
});

frontend.on("close", (code) => {
  if (code !== 0 && code !== null) {
    console.error(`${GREEN}[frontend]${RESET} exited with code ${code}`);
  }
});

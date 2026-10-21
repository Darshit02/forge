# About Forge

**Forge** is an open-source, AI-native backend web IDE platform engineered for developers to create, write, run, inspect, and test backend microservices and APIs in real-time — directly from the browser without context switching or local environment friction.

---

## 1. Executive Summary & Mission

Traditional backend development requires juggling separate terminals, local runtimes, container engines, database clients, API testing tools (e.g. Postman), and disparate AI chat windows.

Forge unifies these isolated steps into an integrated, browser-native developer workspace. With Forge, developers can:
- **Bring Your Own Key (BYOK)**: Connect API keys for Google Gemini, OpenAI, Anthropic Claude, or custom OpenAI-compatible endpoints (Ollama, Groq, DeepSeek) with client-side or AES-256-GCM encrypted server storage.
- **Scaffold Instantly**: Select from 10 production-ready framework templates spanning Python, Go, Rust, and Node.js/Bun.
- **AI-Driven Project Building & Tooling**: Chat with an integrated backend engineer agent that can inspect files, create directories, write code, run package installations, and stream changes directly into the project workspace in real-time.
- **Docker-Free Universal Execution Engine**: Run and test backend microservices out-of-the-box directly through the browser. Zero Docker installation or local container configuration required — Forge provisions native managed processes with dynamic port mapping, log streaming, and process supervision, with seamless fallback to isolated containers when Docker is available.
- **Automated OpenAPI Extraction**: Backends automatically expose their OpenAPI/Swagger specifications via HTTP probers or AST (Abstract Syntax Tree) fallbacks.
- **Zero-Setup API Testing**: An integrated, SSRF-protected HTTP client automatically mirrors discovered endpoints, letting developers test routes the moment code is saved.

---

## 2. Key Capabilities & Features

### 🤖 AI-Native Architecture & BYOK Multi-Model Support
- **Flexible Model Selection**: Seamlessly toggle between models (e.g., Gemini 2.0 Flash, GPT-4o, Claude 3.7 Sonnet) or self-hosted models per chat session.
- **Multi-Step Agentic Tool Calling**: The AI model is equipped with workspace tools (`writeFile`, `readFile`, `deleteFile`, `runCommand`) to generate complete microservices, write unit tests, and install dependencies across multiple reasoning steps.
- **Live Event-Stream SSE & WebSockets**: Streaming token deltas and live tool execution cards (`tool-call`, `tool-result`) are streamed progressively to the UI, providing immediate feedback as files are written and verified.
- **Developer & AI Mascots**: Playful visual avatar system based on developer identity seeds.
- **Error Resilience & 1-Click Retry**: Graceful handling of provider rate limits, network interruptions, or invalid keys with clear user remediation and one-click retry actions.

### 🚀 Docker-Free Universal Execution Engine
- **Browser-Based Execution**: Launch, interact with, and stop microservices directly on the website without installing Docker, running local daemon commands, or configuring container runtimes.
- **Managed Process Engine (`ProcessEngine`)**: Automatically resolves language runtimes (Python, Node/Bun, Go, Rust), allocates non-conflicting host ports in `[8001, 9000]`, injects environment variables (`PORT`, `HOST`), and tracks process PIDs.
- **Graceful Lifecycle Management**: Controlled startup, SIGTERM/SIGKILL termination, and zombie process cleanup on service shutdown.
- **Live Terminal & WebSocket Log Streaming**: Real-time stdout and stderr log capture streamed over WebSockets directly to the integrated browser console.
- **Container Sandbox Fallback (`DockerEngine`)**: When Docker is installed and running, Forge can optionally execute workloads inside hardened Docker containers (`uid:gid 1000:1000`, `CapDrop: ALL`, memory limits).

### ⚡ Rapid Project Bootstrapping & Flexible Storage
- **10 First-Class Framework Templates**:
  - **Python**: FastAPI (Uvicorn), Flask (Flasgger), Django (REST Framework & drf-spectacular)
  - **Go**: Gin, Fiber
  - **Rust**: Axum
  - **JavaScript / TypeScript**: Express, NestJS, Hono (Bun-native), Fastify
- **Custom Workspace Folders**: Select and bind any local folder on your host machine or let Forge manage containerized workspaces.
- **Git & Zip Ingestion**: Import existing repositories or upload zipped archives with built-in path traversal (Zip Slip) sanitization.

### 🔄 The Real-Time "Magic Loop"
1. **Code Modification**: The developer edits code in Monaco or the AI agent calls `writeFile` to create/update files in the workspace.
2. **FS Watcher**: Chokidar detects modifications and pushes `file.changed` events across native WebSockets.
3. **Hot Reload / Process Refresh**: The running backend detects changes and hot-reloads in milliseconds.
4. **Spec Extraction**: The spec extractor probes the HTTP port for Swagger/OpenAPI docs or parses ASTs if the server is offline.
5. **Tester Sync**: Discovered routes immediately sync to the API Tester sidebar for instant testing.

### 🧪 Integrated Hardened API Tester
- **Interactive Request Builder**: Configure HTTP methods, path params, query parameters, custom headers, and JSON/form bodies.
- **SSRF Protection**: Hardened against Server-Side Request Forgery; restricts outbound requests strictly to local execution addresses (`127.0.0.1:[allocated_port]`) and blocks cloud metadata endpoints (e.g. `169.254.169.254`).
- **Collections & History**: Save request collections, view response headers, status codes, payload formatting, and request durations.

---

## 3. High-Level Architecture

```
┌────────────────────────────────────────────────────────────────────────┐
│                      Forge Frontend (React 19 + Vite)                  │
│  - Monaco Editor       - Resizable Split-Panels    - AI Chat Stream    │
│  - API Tester Console  - Execution Log Terminal    - Project Tree      │
└──────────────────┬─────────────────────────────────▲───────────────────┘
                   │ HTTP REST (Hono)                │ WebSockets (/ws)
                   ▼                                 │
┌────────────────────────────────────────────────────┴───────────────────┐
│                      Forge Backend (Bun + Hono)                        │
│                                                                        │
│  ├── Routes: auth, projects, files, containers/execution, ai, tester   │
│  ├── Services:                                                         │
│  │   ├── ExecutionEngine (Unified interface: ProcessEngine | Docker)   │
│  │   ├── SpecExtractor (container/process probe & AST parsing)         │
│  │   ├── AIService (Vercel AI SDK multi-provider tool dispatcher)      │
│  │   ├── FileStoreService (workspace FS manager & zip extractor)       │
│  │   └── TesterService (SSRF-protected HTTP proxy)                     │
│  └── DB & State: PostgreSQL + Drizzle ORM                              │
└──────────────────┬─────────────────────────────────┬───────────────────┘
                   │ Workspace Files                 │ Supervised Runtimes
                   ▼                                 ▼
┌──────────────────────────────────────┐  ┌──────────────────────────────┐
│       Host File System Storage       │  │  Universal Execution Engine  │
│  .data/projects/<project-id>/...     │◄─┼─► Port: 127.0.0.1:<port>     │
│  or user-selected local directory    │  │  Process or Docker Sandbox   │
└──────────────────────────────────────┘  └──────────────────────────────┘
```

---

## 4. Technology Stack

| Layer | Technologies | Role & Advantage |
| :--- | :--- | :--- |
| **Backend Runtime** | [Bun](https://bun.sh/) | High-performance JavaScript/TypeScript runtime with native WebSocket server support |
| **Backend Framework** | [Hono](https://hono.dev/) | Ultra-lightweight, typed HTTP router seamlessly integrated with Bun |
| **Database & ORM** | [PostgreSQL](https://www.postgresql.org/) & [Drizzle ORM](https://orm.drizzle.team/) | Relational data integrity, schema migrations, and type-safe query execution |
| **Execution Engine** | Dual: Native Process Engine + [Docker](https://www.docker.com/) via [dockerode](https://github.com/apocas/dockerode) | Docker-free browser execution out-of-the-box with optional container sandbox isolation |
| **Frontend Framework**| [React 19](https://react.dev/) + [Vite](https://vitejs.dev/) | Fast modern reactive UI paired with instant HMR build tooling |
| **Styling & Design**  | [Tailwind CSS v4](https://tailwindcss.com/) + Radix UI | Ramp-inspired editorial aesthetic with accessible interactive UI primitives |
| **Editor**            | [Monaco Editor](https://microsoft.github.io/monaco-editor/) | VS Code editor core in the browser with syntax highlighting and diff views |
| **AI Integration**    | [Vercel AI SDK](https://sdk.vercel.ai/) (`ai`) | Unified abstraction layer supporting Google Gemini, OpenAI, and Anthropic providers |
| **File Watching**     | [Chokidar](https://github.com/paulmillr/chokidar) | Reliable, debounced host filesystem event monitoring |
| **Testing Engine**    | Bun Test | Fast native unit and integration test runner |

---

## 5. Security Posture

Forge is engineered with defense-in-depth principles:
- **SSRF Hardening**: Outgoing tester requests are validated against strict IP blacklists (RFC 1918 private subnets, cloud metadata addresses `169.254.169.254`, link-local ranges, broadcast, loopback restrictions) allowing only the assigned execution port on `127.0.0.1`.
- **Zip Slip Prevention**: All zip file archive extractions validate that target paths resolve strictly within the project root directory.
- **Path Traversal Guards**: All file reads/writes pass through canonical path validation to prevent escaping the project workspace root.
- **Restricted Tool Allowlist**: AI agent shell execution is restricted to safe package installations and test runners (`npm install`, `pip install`, `bun add`, `pytest`, `cargo add`, `go get`).
- **Encrypted Secrets**: Sensitive user API keys and access tokens are secured at rest using AES-256-GCM encryption with authenticated authentication tags.

---

## 6. Getting Started

### Prerequisites
- **Bun** (v1.1 or higher)
- **PostgreSQL** (v14 or higher)
- *Optional:* **Docker** (only if you wish to run microservices in isolated container sandboxes; not required for standard execution)

### Quick Installation
```bash
# 1. Install dependencies across all workspaces
bun install

# 2. Configure environment
cp .env.example .env

# 3. Apply database migrations
bun run db:push

# 4. Run the full development environment (backend + frontend)
bun run dev
```

The frontend will be accessible at `http://localhost:5173` and the backend API at `http://localhost:3000`.

---

## 7. License & Attribution

Forge is open-source software built for developers who demand velocity and precision in backend engineering.

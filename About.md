# About Forge

**Forge** is an open-source, AI-native backend web IDE platform engineered for developers to create, write, run, inspect, and test backend microservices and APIs in real-time — directly from the browser without context switching.

---

## 1. Executive Summary & Mission

Traditional backend development requires juggling separate terminals, local runtimes, database clients, API testing tools (e.g. Postman), and disparate AI chat windows.

Forge unifies these isolated steps into an integrated, browser-native developer workspace. With Forge, developers can:
- **Bring Your Own Key (BYOK)**: Connect API keys for OpenAI, Anthropic Claude, Google Gemini, or custom OpenAI-compatible endpoints with client-side or AES-256-GCM encrypted server storage.
- **Scaffold Instantly**: Select from 10 production-ready framework templates spanning Python, Go, Rust, and Node.js/Bun.
- **AI-Driven Code Generation & Tooling**: Chat with an integrated backend engineer agent that can inspect files, create directories, write code, run diagnostics, and stream changes directly into the project workspace.
- **Automated OpenAPI Extraction**: Backends automatically expose their OpenAPI/Swagger specifications via HTTP probers or AST (Abstract Syntax Tree) fallbacks.
- **Zero-Setup API Testing**: An integrated, SSRF-protected HTTP client automatically mirrors discovered endpoints, letting developers test routes the moment code is saved.
- **Docker-Free Universal Execution Engine**: Seamlessly executes backend microservices either natively via the managed process execution engine (requiring zero Docker on the user's machine) or through isolated container sandboxes with automatic fallback detection.

---

## 2. Key Capabilities & Features

### 🤖 AI-Native Architecture & BYOK Multi-Model Support
- **Flexible Model Selection**: Seamlessly toggle between models (e.g., Claude 3.5 Sonnet, GPT-4o, Gemini 2.0 Flash) or self-hosted models per chat session.
- **Agentic File Tools**: AI models are augmented with tool-calling capabilities (`readFile`, `writeFile`, `listFiles`, `deleteFile`, `executeCommand`) to directly refactor or construct backend codebases.
- **Real-Time Streaming**: Low-latency token and tool streaming powered by the Vercel AI SDK and native Bun WebSockets.
- **Developer & AI Mascots**: Playful visual avatar system based on developer identity seeds.

### ⚡ Rapid Project Bootstrapping & Flexible Storage
- **10 First-Class Framework Templates**:
  - **Python**: FastAPI (Uvicorn), Flask (Flasgger), Django (REST Framework & drf-spectacular)
  - **Go**: Gin, Fiber
  - **Rust**: Axum
  - **JavaScript / TypeScript**: Express, NestJS, Hono (Bun-native), Fastify
- **Custom Workspace Folders**: Select and bind any local folder on your host machine or let Forge manage containerized workspaces.
- **Git & Zip Ingestion**: Import existing repositories or upload zipped archives with built-in path traversal (Zip Slip) sanitization.

### 🔄 The Real-Time "Magic Loop"
1. **File Change**: The developer edits code in Monaco or the AI tool writes a file to the host workspace.
2. **FS Watcher**: Chokidar detects modifications and pushes `file.changed` events across native WebSockets.
3. **Hot Reload**: The sandbox container detects changes and reloads the server process in milliseconds.
4. **Spec Extraction**: The spec extractor probes the container HTTP port for Swagger/OpenAPI docs or parses ASTs if the server is offline.
5. **Tester Sync**: Discovered routes immediately sync to the Tester sidebar for instant execution.

### 🧪 Integrated Hardened API Tester
- **Interactive Request Builder**: Configure HTTP methods, path params, query parameters, custom headers, and JSON/form bodies.
- **SSRF Protection**: Hardened against Server-Side Request Forgery; restricts outbound requests strictly to local container sandbox addresses (`127.0.0.1:[allocated_port]`) and blocks cloud metadata endpoints (e.g. `169.254.169.254`).
- **Collections & History**: Save request collections, view response headers, status codes, payload formatting, and request durations.

### 🛡️ Enterprise Security & Sandboxing
- **Container Isolation**: Non-root execution (`uid:gid 1000:1000`), Linux capability drops (`CapDrop: ALL`), memory caps (512MB default), and CPU throttles (1.0 core).
- **Dynamic Port Allocation**: Safe non-conflicting host port allocation tracked within range `[8001, 9000]`.
- **Encrypted Credentials**: User AI keys are encrypted at rest using AES-256-GCM with authenticated authentication tags.
- **JWT & Rate Limiting**: Secure access tokens with refresh rotation and sliding-window rate limiters.

---

## 3. High-Level Architecture

```
┌────────────────────────────────────────────────────────────────────────┐
│                      Forge Frontend (React 19 + Vite)                  │
│  - Monaco Editor       - Resizable Split-Panels    - AI Chat Stream    │
│  - API Tester Console  - Container Log Terminal    - Project Tree      │
└──────────────────┬─────────────────────────────────▲───────────────────┘
                   │ HTTP REST (Hono)                │ WebSockets (/ws)
                   ▼                                 │
┌────────────────────────────────────────────────────┴───────────────────┐
│                      Forge Backend (Bun + Hono)                        │
│                                                                        │
│  ├── Routes: auth, projects, files, containers, ai, spec, tester       │
│  ├── Services:                                                         │
│  │   ├── DockerService (dockerode container sandbox lifecycle)         │
│  │   ├── SpecExtractor (container probe & AST parsing)                 │
│  │   ├── AIService (Vercel AI SDK multi-provider tool dispatcher)      │
│  │   ├── FileStoreService (workspace FS manager & zip extractor)       │
│  │   └── TesterService (SSRF-protected HTTP proxy)                     │
│  └── DB & State: PostgreSQL + Drizzle ORM                              │
└──────────────────┬─────────────────────────────────┬───────────────────┘
                   │ Host Bind Mount                 │ Docker Daemon
                   ▼                                 ▼
┌──────────────────────────────────────┐  ┌──────────────────────────────┐
│       Host File System Storage       │  │  Isolated Docker Sandbox     │
│  .data/projects/<project-id>/...     │◄─┼─► Port: 127.0.0.1:<port>     │
│  or user-selected local directory    │  │  User: 1000:1000 | CapDrop   │
└──────────────────────────────────────┘  └──────────────────────────────┘
```

---

## 4. Technology Stack

| Layer | Technologies | Role & Advantage |
| :--- | :--- | :--- |
| **Backend Runtime** | [Bun](https://bun.sh/) | High-performance JavaScript/TypeScript runtime with native WebSocket server support |
| **Backend Framework** | [Hono](https://hono.dev/) | Ultra-lightweight, typed HTTP router seamlessly integrated with Bun |
| **Database & ORM** | [PostgreSQL](https://www.postgresql.org/) & [Drizzle ORM](https://orm.drizzle.team/) | Relational data integrity, schema migrations, and type-safe query execution |
| **Container Engine** | [Docker](https://www.docker.com/) via [dockerode](https://github.com/apocas/dockerode) | Safe programmatic container creation, log streaming, and lifecycle management |
| **Frontend Framework**| [React 19](https://react.dev/) + [Vite](https://vitejs.dev/) | Fast modern reactive UI paired with instant HMR build tooling |
| **Styling & Design**  | [Tailwind CSS v4](https://tailwindcss.com/) + Radix UI | Ramp-inspired editorial aesthetic with accessible interactive UI primitives |
| **Editor**            | [Monaco Editor](https://microsoft.github.io/monaco-editor/) | VS Code editor core in the browser with syntax highlighting and diff views |
| **AI Integration**    | [Vercel AI SDK](https://sdk.vercel.ai/) (`ai`) | Unified abstraction layer supporting OpenAI, Anthropic, and Google providers |
| **File Watching**     | [Chokidar](https://github.com/paulmillr/chokidar) | Reliable, debounced host filesystem event monitoring |
| **Testing Engine**    | Bun Test | Fast native unit and integration test runner |

---

## 5. Monorepo Structure

```
forge/
├── .data/                  # Persistent project workspace files & container mounts
├── docker/                 # Container definition files and compose configs
├── frontend/               # React 19 single-page application
│   ├── public/             # Static assets, logos, and mascots
│   └── src/
│       ├── components/     # UI components (editor, chat, tester, console, layout)
│       ├── hooks/          # React hooks (auth, chat streams, websockets)
│       ├── lib/            # Utilities, API clients, mascot logic
│       ├── pages/          # Route views (Landing, Dashboard, Project, Settings)
│       └── stores/         # Zustand state stores (chat, project, editor)
├── packages/
│   └── shared/             # Shared TypeScript schemas, enums, API contracts, and types
├── sandbox-images/         # Base Dockerfile definitions for framework runtimes
├── scripts/                # Utility scripts for setup, cleanup, and smoke tests
├── src/                    # Backend server source code
│   ├── config/             # Environment variables and system constants
│   ├── db/                 # Drizzle schemas, connection pool, and migrations
│   ├── middleware/         # Auth, rate limiting, and error handling middleware
│   ├── routes/             # Hono HTTP route modules
│   ├── services/           # Core domain logic (AI, Docker, Spec, Tester, FileStore)
│   ├── utils/              # Cryptographic, logger, and ULID/UUID utilities
│   └── ws/                 # Realtime WebSocket hub and channels
├── templates/              # Framework starter codebases (FastAPI, Gin, Axum, etc.)
└── tests/                  # Integration and security test suites
```

---

## 6. Security Posture

Forge is engineered with defense-in-depth principles:
- **SSRF Hardening**: Outgoing tester requests are validated against strict IP blacklists (RFC 1918 private subnets, cloud metadata addresses `169.254.169.254`, link-local ranges, broadcast, loopback restrictions) allowing only the assigned container port on `127.0.0.1`.
- **Zip Slip Prevention**: All zip file archive extractions validate that target paths resolve strictly within the project root directory.
- **Path Traversal Guards**: All file reads/writes pass through canonical path validation to prevent escaping the project workspace root.
- **Container Sandboxing**: Runtimes run unprivileged with minimal capabilities dropped, preventing container escape exploits.
- **Encrypted Secrets**: Sensitive API keys and access tokens are secured with AES-256-GCM cryptographic encryption.

---

## 7. Getting Started

### Prerequisites
- **Bun** (v1.1 or higher)
- **PostgreSQL** (v14 or higher)
- **Docker** engine active and running

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

## 8. License & Attribution

Forge is open-source software built for developers who demand velocity and precision in backend engineering.

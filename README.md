# Forge — AI-Native Backend IDE Platform (Backend Service)

Forge is an AI-native backend web IDE platform that enables developers to create, write, run, inspect, and test backend applications in real-time.

Users can bring their own AI API key (OpenAI, Anthropic, Google, or custom OpenAI-compatible endpoints), choose their language/framework, chat with an AI that writes code directly to their project workspace, have their container auto-expose its OpenAPI spec, and test endpoints directly inside Forge without tab-switching.

---

## Architecture Overview

```
                      ┌────────────────────────────────────────┐
                      │              Forge Frontend            │
                      │  (Editor, AI Chat, API Tester Panel)   │
                      └──────────────┬──────────────────▲──────┘
                                     │ HTTP (REST/SSE)  │ WebSockets (/ws)
                                     ▼                  │
┌───────────────────────────────────────────────────────┴────────────────────────────────────────┐
│                                       Forge Backend (Bun + Hono)                               │
├────────────────────────────────────────────────────────────────────────────────────────────────┤
│  Routes & Middleware:                                                                          │
│  - /api/auth             (JWT access + httpOnly refresh, bcrypt)                               │
│  - /api/providers        (BYOK AI Keys, AES-256-GCM encryption at rest)                        │
│  - /api/projects         (FastAPI, Express, NestJS, Hono, Flask, Django)                       │
│  - /api/projects/:id/files (Host FS, bind-mounted, path sanitization)                          │
│  - /api/projects/:id/chat  (Vercel AI SDK unified multi-provider streaming + tool execution)   │
│  - /api/projects/:id/spec  (Container HTTP probe + AST fallback)                               │
│  - /api/projects/:id/test  (Hardened SSRF-protected HTTP proxy)                                │
│  - /ws                     (Native Bun WebSockets with per-project pub/sub)                    │
├────────────────────────────────────────────────────────────────────────────────────────────────┤
│  Realtime Magic Loop:                                                                          │
│  AI Tool Call (writeFile) ──► Host FS ──► Chokidar Watcher ──► WebSocket (file.changed)        │
│                                                   │                                            │
│                                                   ▼ (debounced 800ms)                          │
│                                           Container Hot Reload                                 │
│                                                   │                                            │
│                                                   ▼                                            │
│                                         OpenAPI Spec Extracted                                 │
│                                                   │                                            │
│                                                   ▼                                            │
│                                        WebSocket (spec.updated)                                │
│                                                   │                                            │
│                                                   ▼                                            │
│                                          Tester Panel Updates                                  │
└────────────────┬──────────────────────────────────────────────────────────────┬────────────────┘
                 │ Bind Mount                                                   │ Dockerode API
                 ▼                                                              ▼
┌──────────────────────────────────┐                           ┌─────────────────────────────────┐
│          Host Filesystem         │                           │      Isolated Docker Container   │
│ /var/app/data/projects/<id>/ws   │◄─────────────────────────►│ - User: 1000:1000 (non-root)    │
└──────────────────────────────────┘                           │ - CapDrop: ALL                  │
                                                               │ - Mem: 512MB, CPU: 1.0          │
                                                               │ - Port: 127.0.0.1:<allocated>   │
                                                               └─────────────────────────────────┘
```

---

## Tech Stack

| Component | Technology | Rationale |
| :--- | :--- | :--- |
| **Runtime** | **Bun** | Ultrafast native execution, native WebSockets, fast bundling |
| **Web Framework** | **Hono** | Lightweight, typed router with native Bun integration |
| **Database** | **PostgreSQL + Drizzle ORM** | Type-safe SQL queries, relational modeling, migrations |
| **Realtime** | **Native Bun WebSockets** | Zero-dependency high-throughput realtime event dispatching |
| **Containerization** | **dockerode** | Programmatic lifecycle control of isolated sandbox containers |
| **File Watching** | **chokidar** | Cross-platform filesystem watcher with debounce support |
| **AI Framework** | **Vercel AI SDK (`ai`)** | Unified streaming interface for OpenAI, Anthropic, Google |
| **Encryption** | **AES-256-GCM** | Authenticated at-rest encryption for user API keys |
| **Validation** | **Zod (`@hono/zod-validator`)**| Strict schema enforcement on all API inputs |
| **Logging** | **pino + pino-pretty** | Structured JSON logging with high-performance formatting |

---

## Directory Structure

```
src/
├── index.ts                    # Hono app bootstrap, native Bun WebSocket upgrade
├── config/
│   ├── env.ts                  # Zod-validated environment variables
│   └── constants.ts            # System constants, ports, limits, SSRF policies
├── db/
│   ├── client.ts               # PostgreSQL connection pool & Drizzle ORM
│   ├── schema.ts               # 11 relational tables, enums, indexes
│   └── migrations/             # Generated SQL migrations (0000_heavy_mystique.sql)
├── middleware/
│   ├── auth.ts                 # JWT verification & project ownership enforcement
│   ├── rateLimit.ts            # Sliding-window rate limiters (auth, chat, tester)
│   └── errorHandler.ts         # Global error serializer & logging
├── routes/
│   ├── auth.routes.ts          # Register, login, refresh, logout, me
│   ├── users.routes.ts         # User profile endpoints
│   ├── providers.routes.ts     # BYOK encrypted AI keys CRUD & test ping
│   ├── projects.routes.ts      # Project CRUD, template listing, git/zip imports
│   ├── files.routes.ts         # Host FS tree listing, reading, writing, uploads
│   ├── containers.routes.ts    # Start, stop, restart, status, SSE logs
│   ├── ai.routes.ts            # Streaming AI chat & tool execution
│   ├── spec.routes.ts          # OpenAPI spec retrieval & forced refresh
│   ├── tester.routes.ts        # SSRF-protected HTTP proxy & test history
│   ├── collections.routes.ts   # Saved test folders & request editing
│   └── environments.routes.ts  # Project environment variables
├── services/
│   ├── auth.service.ts         # Password hashing & JWT generation/rotation
│   ├── crypto.service.ts       # AES-256-GCM encryption & key masking
│   ├── project.service.ts      # Project lifecycle & git/zip import
│   ├── fileStore.service.ts    # Host FS abstraction & Zip Slip protection
│   ├── docker.service.ts       # Container sandbox management & reconciliation
│   ├── portAllocator.service.ts# Host port tracking in range [8001, 9000]
│   ├── watcher.service.ts      # Chokidar per-project debounced watcher
│   ├── specExtractor.service.ts# OpenAPI container prober + AST parser fallback
│   ├── ai.service.ts           # Unified AI streaming, tools, BYOK resolution
│   ├── scaffold.service.ts     # Template scaffolding
│   └── tester.service.ts       # SSRF validation & HTTP test proxy
├── ws/
│   ├── channels.ts             # Per-project subscriber registry
│   └── hub.ts                  # Realtime message dispatcher & client events
├── templates/                  # Framework starter templates
│   ├── fastapi/                # Python FastAPI + uvicorn
│   ├── express/                # Node Express + swagger-jsdoc
│   ├── nestjs/                 # Node NestJS + SwaggerModule
│   ├── hono/                   # Bun Hono + @hono/zod-openapi
│   ├── flask/                  # Python Flask + Flasgger
│   └── django/                 # Python Django REST Framework + drf-spectacular
└── utils/
    ├── ids.ts                  # ULID & UUID generators
    ├── logger.ts               # Structured Pino logger
    └── errors.ts               # Operational HTTP error classes
```

---

## Getting Started

### 1. Prerequisites
- **Bun**: v1.1+ (`curl -fsSL https://bun.sh/install | bash`)
- **PostgreSQL**: v14+ running locally or in Docker
- **Docker**: Docker daemon running with accessible socket

### 2. Environment Configuration
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Review the values:
```env
DATABASE_URL=postgres://postgres:postgres@127.0.0.1:5432/forge
JWT_SECRET=forge-jwt-super-secret-key-change-in-production-1234
JWT_REFRESH_SECRET=forge-refresh-super-secret-key-change-in-production-5678
AI_KEY_ENCRYPTION_SECRET=eFR5UGFzQzlhblZtd1dYTkxQUVJaS1NUVVZXWVpBQkM=
PROJECTS_ROOT=/var/app/data/projects
PORT_RANGE_START=8001
PORT_RANGE_END=9000
DOCKER_SOCKET=/var/run/docker.sock
PORT=3000
NODE_ENV=development
```

> **Note**: To generate a new 32-byte encryption key for `AI_KEY_ENCRYPTION_SECRET`:
> ```bash
> openssl rand -base64 32
> ```

### 3. Install Dependencies
```bash
bun install
```

### 4. Database Setup & Migrations
Ensure PostgreSQL is running, then run migrations:
```bash
# Push schema directly to database
bun run db:push

# Or run generated SQL migrations
bun run db:migrate
```

### 5. Build Sandbox Docker Images
Build the framework sandbox images used for project execution:
```bash
./docker/build-sandboxes.sh
```

### 6. Run the Server
```bash
# Development mode with hot-reloading
bun run dev

# Or production start
bun run start
```

### 7. Run Automated Tests
```bash
bun test
```

---

## Security Specifications

1. **AI API Key Encryption**:
   - Encrypted with **AES-256-GCM** before saving to PostgreSQL.
   - Master key is 32-bytes base64 encoded.
   - Stored format: `base64(iv) + ":" + base64(ciphertext) + ":" + base64(authTag)`.
   - Keys are decrypted strictly in-memory during AI calls and are **never logged**.
2. **SSRF Guard**:
   - The test proxy strictly blocks cloud metadata (`169.254.169.254`), private IP ranges (`10.x`, `172.16-31.x`, `192.168.x`), and external hostnames.
   - Requests are only permitted to `127.0.0.1:<allocated_project_port>`.
3. **Sandbox Hardening**:
   - User `1000:1000` (non-root).
   - `CapDrop: ["ALL"]`, `SecurityOpt: ["no-new-privileges"]`.
   - Memory capped at `512 MB`, CPU limited to `1.0`.
4. **Path Traversal & Zip Slip Prevention**:
   - FileStore rejects paths with `..` or null bytes.
   - Resolves all paths relative to `/var/app/data/projects/<id>/workspace` and verifies boundary constraints.
   - Zip extraction inspects every archive entry before extracting.
5. **Rate Limiting**:
   - `/api/auth/*` → 10 req/min/IP.
   - `/api/projects/*/chat` → 30 req/min/user.
   - `/api/projects/*/test` → 120 req/min/user.

---

## Complete Happy Path Walkthrough (cURL)

Below is an end-to-end walkthrough showing how a developer registers, connects an AI key, scaffolds a project, generates code with AI, observes realtime spec extraction, and tests the live API.

### 1. Register a New Account
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "developer@forge.dev",
    "password": "StrongPassword123!",
    "name": "Dev User"
  }'
```
**Response:**
```json
{
  "user": {
    "id": "11111111-2222-3333-4444-555555555555",
    "email": "developer@forge.dev",
    "name": "Dev User"
  },
  "accessToken": "eyJhbGciOi..."
}
```
*(Save the `accessToken` into `TOKEN="eyJhbGciOi..."`)*

---

### 2. Add an AI API Key (BYOK)
Add an OpenAI, Anthropic, Google, or custom OpenAI-compatible endpoint key:
```bash
curl -X POST http://localhost:3000/api/providers \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "provider": "openai",
    "label": "My OpenAI Key",
    "apiKey": "sk-proj-sample-test-key-1234567890",
    "modelDefault": "gpt-4o"
  }'
```
**Response:**
```json
{
  "provider": {
    "id": "22222222-3333-4444-5555-666666666666",
    "provider": "openai",
    "label": "My OpenAI Key",
    "maskedKey": "sk-proj••••7890",
    "modelDefault": "gpt-4o",
    "isDefault": true
  }
}
```

Test provider latency and key validity:
```bash
curl -X POST http://localhost:3000/api/providers/22222222-3333-4444-5555-666666666666/test \
  -H "Authorization: Bearer $TOKEN"
```

---

### 3. Create a New Project (FastAPI)
```bash
curl -X POST http://localhost:3000/api/projects \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "E-Commerce Microservice",
    "description": "Backend API for e-commerce catalog",
    "language": "python",
    "framework": "fastapi",
    "source": "scratch"
  }'
```
**Response:**
```json
{
  "project": {
    "id": "33333333-4444-5555-6666-777777777777",
    "name": "E-Commerce Microservice",
    "language": "python",
    "framework": "fastapi",
    "status": "stopped",
    "workspacePath": "/var/app/data/projects/33333333-4444-5555-6666-777777777777/workspace"
  }
}
```
*(Save the project ID into `PROJECT_ID="33333333-4444-5555-6666-777777777777"`)*

---

### 4. Start the Project Sandbox Container
```bash
curl -X POST http://localhost:3000/api/projects/$PROJECT_ID/start \
  -H "Authorization: Bearer $TOKEN"
```
**Response:**
```json
{
  "container": {
    "status": "running",
    "containerId": "a1b2c3d4e5f6...",
    "hostPort": 8001
  }
}
```

---

### 5. Connect Realtime WebSocket
Connect via browser or command-line WebSocket client:
```
ws://localhost:3000/ws?projectId=33333333-4444-5555-6666-777777777777&token=eyJhbGciOi...
```
Connected clients receive real-time updates:
```json
{ "type": "container.status", "status": "running" }
{ "type": "file.changed", "path": "main.py" }
{ "type": "spec.updated", "spec": { ... } }
{ "type": "ai.token", "delta": "def " }
{ "type": "test.result", "response": { ... } }
```

---

### 6. Chat with AI to Add Endpoints (Streaming SSE)
Prompt the AI to implement new routes:
```bash
curl -N -X POST http://localhost:3000/api/projects/$PROJECT_ID/chat \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Add a GET /products and POST /products endpoint with Pydantic validation",
    "mode": "edit"
  }'
```

**Streamed SSE Events:**
```
event: session
data: {"sessionId":"44444444-5555-6666-7777-888888888888"}

event: token
data: {"delta":"I will add the Product model and the /products endpoints to main.py."}

event: done
data: {"messageId":"55555555-6666-7777-8888-999999999999","toolCalls":[{"toolName":"writeFile","args":{"path":"main.py","content":"..."}}]}
```

**The Magic Loop in Action:**
1. AI calls tool `writeFile("main.py", ...)`
2. `FileStoreService` writes updated file to host filesystem
3. `Chokidar` watcher detects file write
4. Broadcasts `{ type: "file.changed", path: "main.py" }` to WebSocket
5. Running container hot-reloads via uvicorn
6. Spec extractor detects updated routes and fetches `/openapi.json`
7. Broadcasts `{ type: "spec.updated", spec: ... }` to WebSocket
8. Synchronizes new requests into the API Tester collection

---

### 7. Inspect the Auto-Synchronized OpenAPI Spec
```bash
curl -X GET http://localhost:3000/api/projects/$PROJECT_ID/spec \
  -H "Authorization: Bearer $TOKEN"
```
**Response:**
```json
{
  "spec": {
    "openapi": "3.1.0",
    "info": { "title": "Forge FastAPI Backend", "version": "1.0.0" },
    "paths": {
      "/health": { "get": { ... } },
      "/users": { "get": { ... }, "post": { ... } },
      "/products": { "get": { ... }, "post": { ... } }
    }
  }
}
```

---

### 8. Test the Endpoint via Built-in API Tester Proxy
Send a request through the Forge API tester proxy without opening Postman:
```bash
curl -X POST http://localhost:3000/api/projects/$PROJECT_ID/test \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "method": "POST",
    "path": "/products",
    "headers": {
      "Content-Type": "application/json"
    },
    "body": {
      "id": 101,
      "name": "Ergonomic Mechanical Keyboard",
      "price": 149.99
    }
  }'
```

**Response:**
```json
{
  "status": 201,
  "headers": {
    "content-type": "application/json",
    "content-length": "68"
  },
  "body": {
    "id": 101,
    "name": "Ergonomic Mechanical Keyboard",
    "price": 149.99
  },
  "durationMs": 14
}
```

---

### 9. View Test Execution History
```bash
curl -X GET http://localhost:3000/api/projects/$PROJECT_ID/test/history \
  -H "Authorization: Bearer $TOKEN"
```
**Response:**
```json
{
  "history": [
    {
      "id": "66666666-7777-8888-9999-000000000000",
      "method": "POST",
      "path": "/products",
      "statusCode": 201,
      "durationMs": 14,
      "ranAt": "2026-10-15T12:00:00.000Z"
    }
  ]
}
```

---

## License
MIT

import path from "node:path";

export const CONSTANTS = {
  // Port range for allocated project sandbox containers
  PORT_RANGE: {
    DEFAULT_START: 8001,
    DEFAULT_END: 9000,
  },

  // File size & upload constraints
  LIMITS: {
    MAX_FILE_SIZE_BYTES: 2 * 1024 * 1024, // 2 MB
    MAX_UPLOAD_ZIP_BYTES: 50 * 1024 * 1024, // 50 MB
    MAX_FILE_TREE_DEPTH: 10,
    MAX_CONTEXT_FILES: 50,
    MAX_CONTEXT_FILE_SIZE_BYTES: 100 * 1024, // 100 KB per file for AI context
  },

  // JWT configuration
  AUTH: {
    ACCESS_TOKEN_EXPIRY: "15m",
    REFRESH_TOKEN_EXPIRY: "7d",
    REFRESH_TOKEN_COOKIE: "forge_refresh_token",
    REFRESH_TOKEN_MAX_AGE_MS: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
    SALT_ROUNDS: 10,
  },

  // Rate limiting policies
  RATE_LIMITS: {
    AUTH: {
      WINDOW_MS: 60 * 1000, // 1 minute
      MAX_REQUESTS: 10,
    },
    CHAT: {
      WINDOW_MS: 60 * 1000, // 1 minute
      MAX_REQUESTS: 30,
    },
    TESTER: {
      WINDOW_MS: 60 * 1000, // 1 minute
      MAX_REQUESTS: 120,
    },
    GLOBAL: {
      WINDOW_MS: 60 * 1000, // 1 minute
      MAX_REQUESTS: 300,
    },
  },

  // Docker sandbox settings
  DOCKER: {
    CONTAINER_LABEL_PREFIX: "forge",
    CONTAINER_INTERNAL_PORT: 8000,
    DEFAULT_USER: "1000:1000",
    WORKSPACE_DIR: "/workspace",
    NETWORK_NAME: "forge-sandbox",
    MEMORY_LIMIT: 512 * 1024 * 1024, // 512 MB
    NANO_CPUS: 1_000_000_000, // 1 CPU
    PIDS_LIMIT: 100,
    CAP_DROP: ["ALL"],
    SECURITY_OPT: ["no-new-privileges"],
    RESTART_POLICY: { Name: "unless-stopped" },
    LOG_CONFIG: {
      Type: "json-file",
      Config: {
        "max-size": "10m",
        "max-file": "3",
      },
    },
    HEALTH_CHECK_TIMEOUT_MS: 30_000,
    HEALTH_CHECK_INTERVAL_MS: 1_000,
  },

  // Watcher configuration
  WATCHER: {
    DEBOUNCE_SPEC_MS: 800,
    STABILITY_THRESHOLD_MS: 300,
    IGNORED_PATHS: [
      /(^|[/\\])\../, // dotfiles
      /node_modules/,
      /__pycache__/,
      /\.git/,
      /dist/,
      /build/,
      /\.venv/,
      /venv/,
      /target/,
    ],
  },

  // Tester SSRF Protection constants
  SSRF_PROTECTION: {
    METADATA_ENDPOINT: "169.254.169.254",
    ALLOWED_HOST: "127.0.0.1",
    FORBIDDEN_IP_PREFIXES: [
      "10.",
      "172.16.",
      "172.17.",
      "172.18.",
      "172.19.",
      "172.20.",
      "172.21.",
      "172.22.",
      "172.23.",
      "172.24.",
      "172.25.",
      "172.26.",
      "172.27.",
      "172.28.",
      "172.29.",
      "172.30.",
      "172.31.",
      "192.168.",
      "0.0.0.0",
      "localhost",
      "::1",
    ],
  },

  // Supported framework OpenAPI discovery paths
  SPEC_PATHS: {
    fastapi: ["/openapi.json", "/docs/oauth2-redirect"],
    hono: ["/doc", "/openapi.json", "/swagger.json"],
    express: ["/api-docs.json", "/swagger.json", "/openapi.json", "/docs.json"],
    nestjs: ["/api-json", "/swagger-json", "/openapi.json"],
    flask: ["/apispec.json", "/swagger.json", "/openapi.json"],
    django: ["/api/schema/", "/swagger/?format=openapi", "/api/schema.json"],
    fastify: ["/documentation/json", "/openapi.json"],
    fiber: ["/swagger/doc.json"],
    gin: ["/swagger/doc.json"],
    axum: ["/api-docs/openapi.json"],
  } as Record<string, string[]>,
} as const;

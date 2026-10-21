import fs from "node:fs";
import path from "node:path";
import { z } from "zod";
import dotenv from "dotenv";

dotenv.config();

const envSchema = z.object({
  DATABASE_URL: z
    .string()
    .url()
    .default("postgres://postgres:postgres@127.0.0.1:5432/forge"),
  JWT_SECRET: z
    .string()
    .min(16, "JWT_SECRET must be at least 16 characters")
    .default("forge-jwt-super-secret-key-change-in-production-1234"),
  JWT_REFRESH_SECRET: z
    .string()
    .min(16, "JWT_REFRESH_SECRET must be at least 16 characters")
    .default("forge-refresh-super-secret-key-change-in-production-5678"),
  // AI_KEY_ENCRYPTION_SECRET: 32 bytes base64 encoded
  AI_KEY_ENCRYPTION_SECRET: z
    .string()
    .refine((val) => {
      try {
        const buf = Buffer.from(val, "base64");
        return buf.length === 32;
      } catch {
        return false;
      }
    }, "AI_KEY_ENCRYPTION_SECRET must be a 32-byte base64-encoded string")
    .default("eFR5UGFzQzlhblZtd1dYTkxQUVJaS1NUVVZXWVpBQkM="), // fallback 32-byte base64 for dev
  PROJECTS_ROOT: z
    .string()
    .default(
      process.env.NODE_ENV === "production"
        ? "/var/app/data/projects"
        : `${process.cwd()}/.data/projects`
    )
    .transform((val) => {
      const resolved = path.isAbsolute(val)
        ? val
        : path.resolve(process.cwd(), val);
      try {
        fs.mkdirSync(resolved, { recursive: true });
        fs.accessSync(resolved, fs.constants.W_OK);
        return resolved;
      } catch {
        const fallback = path.resolve(process.cwd(), ".data/projects");
        fs.mkdirSync(fallback, { recursive: true });
        return fallback;
      }
    }),
  PORT_RANGE_START: z.coerce.number().int().default(8001),
  PORT_RANGE_END: z.coerce.number().int().default(9000),
  DOCKER_SOCKET: z
    .string()
    .default(
      process.platform === "darwin" && process.env.HOME
        ? `${process.env.HOME}/.docker/run/docker.sock`
        : "/var/run/docker.sock"
    ),
  EXECUTION_ENGINE: z
    .enum(["auto", "process", "docker"])
    .default("auto"),
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  LOG_LEVEL: z
    .enum(["fatal", "error", "warn", "info", "debug", "trace"])
    .default("info"),
  PORT: z.coerce.number().int().default(3000),
  HOST: z.string().default("0.0.0.0"),
  CORS_ORIGIN: z.string().default("http://localhost:5173"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("❌ Invalid environment variables:", parsed.error.format());
  throw new Error("Invalid environment configuration. Fix .env or environment variables.");
}

export const env = parsed.data;
export type Env = z.infer<typeof envSchema>;

import { z } from "zod";

const envSchema = z.object({
  VITE_API_URL: z.string().default(window.location.origin),
  VITE_WS_URL: z
    .string()
    .default(
      window.location.protocol === "https:"
        ? `wss://${window.location.host}`
        : `ws://${window.location.host}`
    ),
  VITE_POSTHOG_KEY: z.string().optional().default(""),
  VITE_POSTHOG_HOST: z.string().default("https://app.posthog.com"),
});

const parsed = envSchema.safeParse(import.meta.env);

if (!parsed.success) {
  console.error("❌ Invalid frontend environment configuration:", parsed.error.format());
  throw new Error("Invalid Vite environment variables.");
}

export const env = parsed.data;

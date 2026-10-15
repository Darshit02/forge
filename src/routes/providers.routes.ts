import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { eq, and, desc } from "drizzle-orm";
import { requireAuth } from "../middleware/auth.js";
import { db } from "../db/client.js";
import { aiProviders } from "../db/schema.js";
import {
  decryptApiKey,
  encryptApiKey,
  maskApiKey,
} from "../services/crypto.service.js";
import { aiService } from "../services/ai.service.js";
import { ConflictError, NotFoundError } from "../utils/errors.js";

import {
  CreateProviderRequestSchema,
  UpdateProviderRequestSchema,
} from "@forge/shared";

export const providersRoutes = new Hono();

providersRoutes.use("*", requireAuth);

const DEFAULT_MODELS: Record<string, string> = {
  openai: "gpt-4o",
  anthropic: "claude-3-5-sonnet-20241022",
  google: "gemini-1.5-pro-latest",
  custom: "llama3",
};

/**
 * GET /api/providers - List user's providers with keys masked
 */
providersRoutes.get("/", async (c) => {
  const user = c.get("user");

  const rows = await db
    .select()
    .from(aiProviders)
    .where(eq(aiProviders.userId, user.id))
    .orderBy(desc(aiProviders.createdAt));

  const sanitized = rows.map((row) => {
    let maskedKey = "••••••••";
    try {
      const decrypted = decryptApiKey(row.encryptedKey);
      maskedKey = maskApiKey(decrypted);
    } catch {
      // In case of key rotation/corruption
    }

    return {
      id: row.id,
      provider: row.provider,
      label: row.label,
      maskedKey,
      baseUrl: row.baseUrl,
      modelDefault: row.modelDefault,
      isDefault: row.isDefault,
      createdAt: row.createdAt,
    };
  });

  return c.json({ providers: sanitized });
});

/**
 * POST /api/providers - Add a new BYOK provider key
 */
providersRoutes.post("/", zValidator("json", CreateProviderRequestSchema), async (c) => {
  const user = c.get("user");
  const body = c.req.valid("json");

  // Check unique label per user
  const existing = await db
    .select({ id: aiProviders.id })
    .from(aiProviders)
    .where(
      and(
        eq(aiProviders.userId, user.id),
        eq(aiProviders.label, body.label.trim())
      )
    )
    .limit(1);

  if (existing.length > 0) {
    throw new ConflictError(
      `An AI provider with label '${body.label}' already exists`
    );
  }

  // Encrypt API key with AES-256-GCM
  const encryptedKey = encryptApiKey(body.apiKey.trim());

  // Check if this is the first provider for user -> make it default
  const userProviders = await db
    .select({ id: aiProviders.id })
    .from(aiProviders)
    .where(eq(aiProviders.userId, user.id))
    .limit(1);

  const isDefault = userProviders.length === 0;
  const modelDefault =
    body.modelDefault || DEFAULT_MODELS[body.provider] || "gpt-4o";

  const [created] = await db
    .insert(aiProviders)
    .values({
      userId: user.id,
      provider: body.provider,
      label: body.label.trim(),
      encryptedKey,
      baseUrl: body.baseUrl || null,
      modelDefault,
      isDefault,
    })
    .returning();

  return c.json(
    {
      provider: {
        id: created.id,
        provider: created.provider,
        label: created.label,
        maskedKey: maskApiKey(body.apiKey.trim()),
        baseUrl: created.baseUrl,
        modelDefault: created.modelDefault,
        isDefault: created.isDefault,
        createdAt: created.createdAt,
      },
    },
    201
  );
});

/**
 * PATCH /api/providers/:id - Update provider configuration
 */
providersRoutes.patch("/:id", zValidator("json", UpdateProviderRequestSchema), async (c) => {
  const user = c.get("user");
  const providerId = c.req.param("id")!;
  const body = c.req.valid("json");

  const [existing] = await db
    .select()
    .from(aiProviders)
    .where(
      and(
        eq(aiProviders.id, providerId),
        eq(aiProviders.userId, user.id)
      )
    )
    .limit(1);

  if (!existing) {
    throw new NotFoundError("AI provider not found");
  }

  const encryptedKey = body.apiKey
    ? encryptApiKey(body.apiKey.trim())
    : undefined;

  const [updated] = await db
    .update(aiProviders)
    .set({
      ...(body.label ? { label: body.label.trim() } : {}),
      ...(encryptedKey ? { encryptedKey } : {}),
      ...(body.baseUrl !== undefined ? { baseUrl: body.baseUrl } : {}),
      ...(body.modelDefault ? { modelDefault: body.modelDefault } : {}),
    })
    .where(eq(aiProviders.id, providerId))
    .returning();

  return c.json({
    provider: {
      id: updated.id,
      provider: updated.provider,
      label: updated.label,
      baseUrl: updated.baseUrl,
      modelDefault: updated.modelDefault,
      isDefault: updated.isDefault,
    },
  });
});

/**
 * DELETE /api/providers/:id - Delete an AI provider key
 */
providersRoutes.delete("/:id", async (c) => {
  const user = c.get("user");
  const providerId = c.req.param("id")!;

  const [deleted] = await db
    .delete(aiProviders)
    .where(
      and(
        eq(aiProviders.id, providerId),
        eq(aiProviders.userId, user.id)
      )
    )
    .returning({ id: aiProviders.id });

  if (!deleted) {
    throw new NotFoundError("AI provider not found");
  }

  return c.json({ ok: true, id: deleted.id });
});

/**
 * POST /api/providers/:id/test - Ping the provider with a tiny request
 */
providersRoutes.post("/:id/test", async (c) => {
  const user = c.get("user");
  const providerId = c.req.param("id")!;

  const [providerRecord] = await db
    .select()
    .from(aiProviders)
    .where(
      and(
        eq(aiProviders.id, providerId),
        eq(aiProviders.userId, user.id)
      )
    )
    .limit(1);

  if (!providerRecord) {
    throw new NotFoundError("AI provider not found");
  }

  const apiKey = decryptApiKey(providerRecord.encryptedKey);
  const result = await aiService.testProvider(
    providerRecord.provider,
    apiKey,
    providerRecord.baseUrl,
    providerRecord.modelDefault
  );

  return c.json(result);
});

/**
 * POST /api/providers/:id/default - Mark as default
 */
providersRoutes.post("/:id/default", async (c) => {
  const user = c.get("user");
  const providerId = c.req.param("id")!;

  // Verify ownership
  const [target] = await db
    .select({ id: aiProviders.id })
    .from(aiProviders)
    .where(
      and(
        eq(aiProviders.id, providerId),
        eq(aiProviders.userId, user.id)
      )
    )
    .limit(1);

  if (!target) {
    throw new NotFoundError("AI provider not found");
  }

  // Unmark previous defaults
  await db
    .update(aiProviders)
    .set({ isDefault: false })
    .where(eq(aiProviders.userId, user.id));

  // Set target as default
  const [updated] = await db
    .update(aiProviders)
    .set({ isDefault: true })
    .where(eq(aiProviders.id, providerId))
    .returning();

  return c.json({ provider: updated });
});

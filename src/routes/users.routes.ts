import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { requireAuth } from "../middleware/auth.js";
import { db } from "../db/client.js";
import { users } from "../db/schema.js";

export const usersRoutes = new Hono();

usersRoutes.use("*", requireAuth);

const updateUserSchema = z.object({
  name: z.string().min(1).max(100).optional(),
});

/**
 * GET /api/users/me
 */
usersRoutes.get("/me", async (c) => {
  const user = c.get("user");
  return c.json({ user });
});

/**
 * PATCH /api/users/me
 */
usersRoutes.patch("/me", zValidator("json", updateUserSchema), async (c) => {
  const user = c.get("user");
  const { name } = c.req.valid("json");

  const [updated] = await db
    .update(users)
    .set({
      ...(name ? { name: name.trim() } : {}),
      updatedAt: new Date(),
    })
    .where(eq(users.id, user.id))
    .returning({
      id: users.id,
      email: users.email,
      name: users.name,
    });

  return c.json({ user: updated });
});

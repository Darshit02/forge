import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { getCookie, setCookie, deleteCookie } from "hono/cookie";
import { authService } from "../services/auth.service.js";
import { requireAuth } from "../middleware/auth.js";
import { authRateLimiter } from "../middleware/rateLimit.js";
import { CONSTANTS } from "../config/constants.js";

import {
  RegisterRequestSchema,
  LoginRequestSchema,
  ForgotPasswordRequestSchema,
  ResetPasswordRequestSchema,
} from "@forge/shared";

export const authRoutes = new Hono();

// Apply auth rate limiter (10 req/min/IP)
authRoutes.use("*", authRateLimiter);

/**
 * POST /api/auth/register
 */
authRoutes.post("/register", zValidator("json", RegisterRequestSchema), async (c) => {
  const body = c.req.valid("json");
  const { user, accessToken, refreshToken } = await authService.register(body);

  // Set httpOnly refresh cookie
  setCookie(c, CONSTANTS.AUTH.REFRESH_TOKEN_COOKIE, refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "Lax",
    maxAge: CONSTANTS.AUTH.REFRESH_TOKEN_MAX_AGE_MS / 1000,
    path: "/",
  });

  return c.json({ user, accessToken }, 201);
});

/**
 * POST /api/auth/login
 */
authRoutes.post("/login", zValidator("json", LoginRequestSchema), async (c) => {
  const body = c.req.valid("json");
  const { user, accessToken, refreshToken } = await authService.login(body);

  // Set httpOnly refresh cookie
  setCookie(c, CONSTANTS.AUTH.REFRESH_TOKEN_COOKIE, refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "Lax",
    maxAge: CONSTANTS.AUTH.REFRESH_TOKEN_MAX_AGE_MS / 1000,
    path: "/",
  });

  return c.json({ user, accessToken });
});

/**
 * POST /api/auth/refresh
 */
authRoutes.post("/refresh", async (c) => {
  const refreshToken =
    getCookie(c, CONSTANTS.AUTH.REFRESH_TOKEN_COOKIE) ||
    c.req.header("x-refresh-token");

  if (!refreshToken) {
    return c.json({ error: "Refresh token is required" }, 401);
  }

  const { user, accessToken } = await authService.refresh(refreshToken);
  return c.json({ user, accessToken });
});

/**
 * POST /api/auth/logout
 */
authRoutes.post("/logout", async (c) => {
  deleteCookie(c, CONSTANTS.AUTH.REFRESH_TOKEN_COOKIE, {
    path: "/",
  });
  return c.json({ ok: true });
});

/**
 * POST /api/auth/forgot-password
 */
authRoutes.post("/forgot-password", zValidator("json", ForgotPasswordRequestSchema), async (c) => {
  const body = c.req.valid("json");
  const result = await authService.requestPasswordReset(body.email);
  return c.json(result);
});

/**
 * POST /api/auth/reset-password
 */
authRoutes.post("/reset-password", zValidator("json", ResetPasswordRequestSchema), async (c) => {
  const body = c.req.valid("json");
  const result = await authService.resetPassword(body);
  return c.json(result);
});

/**
 * GET /api/auth/me
 */
authRoutes.get("/me", requireAuth, async (c) => {
  const user = c.get("user");
  return c.json({ user });
});

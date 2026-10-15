import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "../db/client.js";
import { users } from "../db/schema.js";
import { env } from "../config/env.js";
import { CONSTANTS } from "../config/constants.js";
import type { AuthenticatedUser, JwtPayload } from "../types/index.js";
import {
  BadRequestError,
  ConflictError,
  NotFoundError,
  UnauthorizedError,
} from "../utils/errors.js";

export class AuthService {
  /**
   * Hashes a plaintext password using bcrypt
   */
  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, CONSTANTS.AUTH.SALT_ROUNDS);
  }

  /**
   * Verifies a plaintext password against a bcrypt hash
   */
  async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  /**
   * Creates an access token (15 mins)
   */
  generateAccessToken(user: { id: string; email: string }): string {
    const payload: JwtPayload = {
      userId: user.id,
      email: user.email,
      type: "access",
    };
    return jwt.sign(payload, env.JWT_SECRET, {
      expiresIn: CONSTANTS.AUTH.ACCESS_TOKEN_EXPIRY,
    });
  }

  /**
   * Creates a refresh token (7 days)
   */
  generateRefreshToken(user: { id: string; email: string }): string {
    const payload: JwtPayload = {
      userId: user.id,
      email: user.email,
      type: "refresh",
    };
    return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
      expiresIn: CONSTANTS.AUTH.REFRESH_TOKEN_EXPIRY,
    });
  }

  /**
   * Verifies an access token
   */
  verifyAccessToken(token: string): JwtPayload {
    try {
      const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
      if (decoded.type !== "access") {
        throw new UnauthorizedError("Invalid token type for access");
      }
      return decoded;
    } catch (err) {
      if (err instanceof UnauthorizedError) throw err;
      throw new UnauthorizedError("Invalid or expired access token");
    }
  }

  /**
   * Verifies a refresh token
   */
  verifyRefreshToken(token: string): JwtPayload {
    try {
      const decoded = jwt.verify(token, env.JWT_REFRESH_SECRET) as JwtPayload;
      if (decoded.type !== "refresh") {
        throw new UnauthorizedError("Invalid token type for refresh");
      }
      return decoded;
    } catch (err) {
      if (err instanceof UnauthorizedError) throw err;
      throw new UnauthorizedError("Invalid or expired refresh token");
    }
  }

  /**
   * Register a new user
   */
  async register(input: {
    email: string;
    password: string;
    name?: string;
  }): Promise<{ user: AuthenticatedUser; accessToken: string; refreshToken: string }> {
    const existing = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, input.email.toLowerCase().trim()))
      .limit(1);

    if (existing.length > 0) {
      throw new ConflictError("A user with this email already exists");
    }

    const passwordHash = await this.hashPassword(input.password);

    const [newUser] = await db
      .insert(users)
      .values({
        email: input.email.toLowerCase().trim(),
        passwordHash,
        name: input.name?.trim() || null,
      })
      .returning({
        id: users.id,
        email: users.email,
        name: users.name,
      });

    const accessToken = this.generateAccessToken(newUser);
    const refreshToken = this.generateRefreshToken(newUser);

    return {
      user: newUser,
      accessToken,
      refreshToken,
    };
  }

  /**
   * Log in an existing user
   */
  async login(input: {
    email: string;
    password: string;
  }): Promise<{ user: AuthenticatedUser; accessToken: string; refreshToken: string }> {
    const [userRecord] = await db
      .select()
      .from(users)
      .where(eq(users.email, input.email.toLowerCase().trim()))
      .limit(1);

    if (!userRecord) {
      throw new UnauthorizedError("Invalid email or password");
    }

    const isValid = await this.verifyPassword(
      input.password,
      userRecord.passwordHash
    );

    if (!isValid) {
      throw new UnauthorizedError("Invalid email or password");
    }

    const user: AuthenticatedUser = {
      id: userRecord.id,
      email: userRecord.email,
      name: userRecord.name,
    };

    const accessToken = this.generateAccessToken(user);
    const refreshToken = this.generateRefreshToken(user);

    return {
      user,
      accessToken,
      refreshToken,
    };
  }

  /**
   * Refresh an access token using a valid refresh token
   */
  async refresh(
    refreshTokenString: string
  ): Promise<{ user: AuthenticatedUser; accessToken: string }> {
    if (!refreshTokenString) {
      throw new UnauthorizedError("Refresh token missing");
    }

    const payload = this.verifyRefreshToken(refreshTokenString);

    const [userRecord] = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
      })
      .from(users)
      .where(eq(users.id, payload.userId))
      .limit(1);

    if (!userRecord) {
      throw new NotFoundError("User not found");
    }

    const accessToken = this.generateAccessToken(userRecord);

    return {
      user: userRecord,
      accessToken,
    };
  }

  /**
   * Get user by ID
   */
  async getUserById(userId: string): Promise<AuthenticatedUser> {
    const [userRecord] = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!userRecord) {
      throw new NotFoundError("User not found");
    }

    return userRecord;
  }
}

export const authService = new AuthService();

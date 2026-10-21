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

  /**
   * Generates a password reset token (15 mins)
   */
  generatePasswordResetToken(user: { id: string; email: string }): string {
    const payload = {
      userId: user.id,
      email: user.email,
      type: "reset_password",
    };
    return jwt.sign(payload, env.JWT_SECRET, {
      expiresIn: "15m",
    });
  }

  /**
   * Verifies a password reset token
   */
  verifyPasswordResetToken(token: string): JwtPayload {
    try {
      const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
      if (decoded.type !== "reset_password") {
        throw new BadRequestError("Invalid token type for password reset");
      }
      return decoded;
    } catch (err: any) {
      if (err instanceof BadRequestError) throw err;
      throw new BadRequestError("Invalid or expired password reset token");
    }
  }

  /**
   * Request password reset for an email
   */
  async requestPasswordReset(email: string): Promise<{ ok: boolean; resetToken?: string; message: string }> {
    const cleanEmail = email.toLowerCase().trim();
    const [user] = await db
      .select({ id: users.id, email: users.email })
      .from(users)
      .where(eq(users.email, cleanEmail))
      .limit(1);

    if (!user) {
      // Avoid user enumeration
      return {
        ok: true,
        message: "If an account with this email exists, password reset instructions have been generated.",
      };
    }

    const resetToken = this.generatePasswordResetToken(user);

    return {
      ok: true,
      resetToken,
      message: "Password reset token generated successfully.",
    };
  }

  /**
   * Resets user password using valid reset token
   */
  async resetPassword(input: {
    email: string;
    resetToken: string;
    newPassword: string;
  }): Promise<{ ok: boolean; message: string }> {
    const cleanEmail = input.email.toLowerCase().trim();

    try {
      const decoded = jwt.verify(input.resetToken, env.JWT_SECRET) as any;
      if (decoded.type !== "reset_password") {
        throw new BadRequestError("Invalid token type for password reset");
      }
      if (decoded.email.toLowerCase().trim() !== cleanEmail) {
        throw new BadRequestError("Token does not match the provided email address");
      }
    } catch (err: any) {
      if (err instanceof BadRequestError) throw err;
      throw new BadRequestError("Invalid or expired password reset token. Please request a new one.");
    }

    const passwordHash = await this.hashPassword(input.newPassword);

    const [updated] = await db
      .update(users)
      .set({
        passwordHash,
        updatedAt: new Date(),
      })
      .where(eq(users.email, cleanEmail))
      .returning({ id: users.id });

    if (!updated) {
      throw new NotFoundError("User account not found");
    }

    return {
      ok: true,
      message: "Password has been successfully updated. You can now sign in.",
    };
  }
}

export const authService = new AuthService();

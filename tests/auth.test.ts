import { describe, it, expect } from "bun:test";
import { authService } from "../src/services/auth.service.js";

describe("AuthService (Hashing & JWT)", () => {
  it("should hash passwords with bcrypt and correctly verify", async () => {
    const password = "SuperSecretPassword123!";
    const hash = await authService.hashPassword(password);

    expect(hash).not.toBe(password);
    expect(hash.startsWith("$2")).toBe(true);

    const isValid = await authService.verifyPassword(password, hash);
    expect(isValid).toBe(true);

    const isInvalid = await authService.verifyPassword("WrongPassword", hash);
    expect(isInvalid).toBe(false);
  });

  it("should issue and verify access tokens", () => {
    const user = { id: "user-123", email: "test@example.com" };
    const accessToken = authService.generateAccessToken(user);

    expect(typeof accessToken).toBe("string");

    const decoded = authService.verifyAccessToken(accessToken);
    expect(decoded.userId).toBe(user.id);
    expect(decoded.email).toBe(user.email);
    expect(decoded.type).toBe("access");
  });

  it("should issue and verify refresh tokens", () => {
    const user = { id: "user-456", email: "refresh@example.com" };
    const refreshToken = authService.generateRefreshToken(user);

    const decoded = authService.verifyRefreshToken(refreshToken);
    expect(decoded.userId).toBe(user.id);
    expect(decoded.email).toBe(user.email);
    expect(decoded.type).toBe("refresh");
  });

  it("should reject access tokens verified as refresh tokens and vice-versa", () => {
    const user = { id: "user-789", email: "cross@example.com" };
    const accessToken = authService.generateAccessToken(user);

    expect(() => authService.verifyRefreshToken(accessToken)).toThrow();
  });
});

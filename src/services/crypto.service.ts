import crypto from "node:crypto";
import { env } from "../config/env.js";
import { BadRequestError } from "../utils/errors.js";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12; // 96-bit IV recommended for AES-GCM

/**
 * Returns the 32-byte master encryption key buffer from base64 env
 */
function getMasterKey(): Buffer {
  const key = Buffer.from(env.AI_KEY_ENCRYPTION_SECRET, "base64");
  if (key.length !== 32) {
    throw new Error(
      `Invalid encryption master key length: expected 32 bytes, got ${key.length}`
    );
  }
  return key;
}

/**
 * Encrypts a plaintext string (e.g. AI API key) using AES-256-GCM.
 * Output format: base64(iv) + ":" + base64(ciphertext) + ":" + base64(authTag)
 */
export function encryptApiKey(plaintext: string): string {
  if (!plaintext || typeof plaintext !== "string") {
    throw new BadRequestError("Cannot encrypt empty or invalid API key");
  }

  const key = getMasterKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  const ciphertext = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);

  const authTag = cipher.getAuthTag();

  return `${iv.toString("base64")}:${ciphertext.toString("base64")}:${authTag.toString("base64")}`;
}

/**
 * Decrypts an encrypted string created with encryptApiKey.
 * Returns the plaintext key in memory only.
 */
export function decryptApiKey(encryptedData: string): string {
  if (!encryptedData || typeof encryptedData !== "string") {
    throw new BadRequestError("Invalid encrypted payload");
  }

  const parts = encryptedData.split(":");
  if (parts.length !== 3) {
    throw new BadRequestError("Malformed encrypted API key payload format");
  }

  const [ivBase64, ciphertextBase64, authTagBase64] = parts;
  const key = getMasterKey();
  const iv = Buffer.from(ivBase64, "base64");
  const ciphertext = Buffer.from(ciphertextBase64, "base64");
  const authTag = Buffer.from(authTagBase64, "base64");

  if (iv.length !== IV_LENGTH) {
    throw new BadRequestError("Invalid initialization vector length");
  }

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  try {
    const decrypted = Buffer.concat([
      decipher.update(ciphertext),
      decipher.final(),
    ]);
    return decrypted.toString("utf8");
  } catch (err) {
    throw new BadRequestError(
      "Failed to decrypt API key: authentication tag mismatch or corrupted data"
    );
  }
}

/**
 * Safely masks an API key for frontend presentation (e.g. 'sk-1...a8f9')
 */
export function maskApiKey(apiKey: string): string {
  if (!apiKey || apiKey.length < 8) {
    return "••••••••";
  }
  const prefixLength = apiKey.startsWith("sk-") ? 7 : 4;
  const prefix = apiKey.slice(0, prefixLength);
  const suffix = apiKey.slice(-4);
  return `${prefix}••••${suffix}`;
}

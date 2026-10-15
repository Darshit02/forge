import { ulid } from "ulid";
import { randomUUID } from "node:crypto";

/**
 * Generate a ULID (Universally Unique Lexicographically Sortable Identifier)
 */
export function generateUlid(): string {
  return ulid();
}

/**
 * Generate a standard RFC 4122 v4 UUID
 */
export function generateUuid(): string {
  return randomUUID();
}

/**
 * Generate a short random alphanumeric slug
 */
export function generateShortId(length = 8): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  const randomBytes = crypto.getRandomValues(new Uint8Array(length));
  for (let i = 0; i < length; i++) {
    result += chars[randomBytes[i] % chars.length];
  }
  return result;
}

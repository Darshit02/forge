import { describe, it, expect } from "bun:test";
import {
  encryptApiKey,
  decryptApiKey,
  maskApiKey,
} from "../src/services/crypto.service.js";

describe("CryptoService (AES-256-GCM)", () => {
  it("should encrypt and successfully decrypt API keys", () => {
    const rawKey = "sk-proj-1234567890abcdefghijklmnopqrstuvwxyz";
    const encrypted = encryptApiKey(rawKey);

    expect(encrypted).not.toBe(rawKey);
    expect(encrypted.split(":").length).toBe(3); // iv:ciphertext:tag

    const decrypted = decryptApiKey(encrypted);
    expect(decrypted).toBe(rawKey);
  });

  it("should fail decryption if ciphertext or auth tag is corrupted", () => {
    const rawKey = "sk-secret-token";
    const encrypted = encryptApiKey(rawKey);
    const [iv, ciphertext, tag] = encrypted.split(":");

    // Corrupt tag
    const corruptedTag = Buffer.from(tag, "base64");
    corruptedTag[0] ^= 0xff; // flip byte
    const corruptedEncrypted = `${iv}:${ciphertext}:${corruptedTag.toString("base64")}`;

    expect(() => decryptApiKey(corruptedEncrypted)).toThrow();
  });

  it("should safely mask API keys for frontend display", () => {
    expect(maskApiKey("sk-proj-1234567890abcdef")).toBe("sk-proj••••cdef");
    expect(maskApiKey("anthropic-key-abcd-1234")).toBe("anth••••1234");
    expect(maskApiKey("short")).toBe("••••••••");
  });
});

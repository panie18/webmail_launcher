import { createCipheriv, createDecipheriv, randomBytes, scrypt } from "crypto";
import { promisify } from "util";
import { readFileSync } from "fs";

const scryptAsync = promisify(scrypt);

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;
const SALT_LENGTH = 32;
const TAG_LENGTH = 16;
const KEY_LENGTH = 32;

// Master key loaded once from file, kept in memory
let masterKey: Buffer | null = null;

/**
 * Load master encryption key from file (Docker secret)
 * Key is kept in memory only - never logged or persisted elsewhere
 */
export async function initializeEncryption(): Promise<void> {
  const keyFilePath = process.env.ENCRYPTION_KEY_FILE;
  if (!keyFilePath) {
    throw new Error("ENCRYPTION_KEY_FILE environment variable not set");
  }

  try {
    const keyBase64 = readFileSync(keyFilePath, "utf-8").trim();
    masterKey = Buffer.from(keyBase64, "base64");
    
    if (masterKey.length < 32) {
      throw new Error("Encryption key must be at least 32 bytes");
    }
    
    // Truncate to exactly 32 bytes for AES-256
    masterKey = masterKey.subarray(0, 32);
  } catch (error) {
    throw new Error(`Failed to load encryption key: ${(error as Error).message}`);
  }
}

/**
 * Derive a unique key for each encryption operation using scrypt
 */
async function deriveKey(salt: Buffer): Promise<Buffer> {
  if (!masterKey) {
    throw new Error("Encryption not initialized");
  }
  return (await scryptAsync(masterKey, salt, KEY_LENGTH)) as Buffer;
}

/**
 * Encrypt sensitive data (credentials, tokens)
 * Returns: salt (32) + iv (16) + tag (16) + ciphertext, base64 encoded
 */
export async function encrypt(plaintext: string): Promise<string> {
  const salt = randomBytes(SALT_LENGTH);
  const iv = randomBytes(IV_LENGTH);
  const key = await deriveKey(salt);

  const cipher = createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();

  // Combine: salt + iv + tag + ciphertext
  const combined = Buffer.concat([salt, iv, tag, encrypted]);
  return combined.toString("base64");
}

/**
 * Decrypt sensitive data
 */
export async function decrypt(encryptedBase64: string): Promise<string> {
  const combined = Buffer.from(encryptedBase64, "base64");

  // Extract components
  const salt = combined.subarray(0, SALT_LENGTH);
  const iv = combined.subarray(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
  const tag = combined.subarray(
    SALT_LENGTH + IV_LENGTH,
    SALT_LENGTH + IV_LENGTH + TAG_LENGTH
  );
  const ciphertext = combined.subarray(SALT_LENGTH + IV_LENGTH + TAG_LENGTH);

  const key = await deriveKey(salt);

  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);

  const decrypted = Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]);

  return decrypted.toString("utf8");
}

/**
 * Securely clear a buffer from memory
 */
export function secureClear(buffer: Buffer): void {
  buffer.fill(0);
}

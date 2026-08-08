import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createCipheriv, createDecipheriv, randomBytes, scryptSync, timingSafeEqual } from 'crypto';

/**
 * Two-way (reversible) encryption of data with AES-256-GCM.
 *
 * Unlike `HashService`, this is reversible — use it for data you must recover
 * later (e.g. third-party tokens at rest), never for passwords. GCM is
 * authenticated, so {@link decrypt} throws if the ciphertext was tampered with.
 *
 * The 256-bit key is derived once (via scrypt) from `ENCRYPTION_KEY` and
 * `ENCRYPTION_SALT` (see `configuration.ts`). `ENCRYPTION_KEY` is optional at
 * boot so the app runs without it; calling encrypt/decrypt without it throws a
 * clear error rather than failing silently.
 *
 * {@link encrypt} returns a single base64 string packing `iv | authTag |
 * ciphertext`; {@link decrypt} reverses exactly that layout. A random IV per
 * call means encrypting the same input twice yields different outputs.
 */
@Injectable()
export class EncryptionService {
  /** Authenticated cipher: encrypts and tamper-protects in one pass. */
  private static readonly ALGORITHM = 'aes-256-gcm';

  /** AES-256 key size in bytes. */
  private static readonly KEY_LENGTH = 32;

  /** Recommended IV size for GCM, in bytes. */
  private static readonly IV_LENGTH = 12;

  /** GCM authentication tag size, in bytes. */
  private static readonly AUTH_TAG_LENGTH = 16;

  private readonly key: Buffer | null;

  public constructor(config: ConfigService) {
    const secret = config.get<string>('encryption.key');
    const salt = config.get<string>('encryption.salt', 'salt');
    this.key = secret ? scryptSync(secret, salt, EncryptionService.KEY_LENGTH) : null;
  }

  /** Encrypt a UTF-8 string; returns base64(`iv | authTag | ciphertext`). */
  public encrypt(plaintext: string): string {
    const iv = randomBytes(EncryptionService.IV_LENGTH);
    const cipher = createCipheriv(EncryptionService.ALGORITHM, this.requireKey(), iv);
    const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
    const authTag = cipher.getAuthTag();
    return Buffer.concat([iv, authTag, encrypted]).toString('base64');
  }

  /**
   * Decrypt a payload produced by {@link encrypt}. Throws if the key is wrong
   * or the ciphertext (or its auth tag) has been altered.
   */
  public decrypt(payload: string): string {
    const data = Buffer.from(payload, 'base64');
    const iv = data.subarray(0, EncryptionService.IV_LENGTH);
    const authTag = data.subarray(
      EncryptionService.IV_LENGTH,
      EncryptionService.IV_LENGTH + EncryptionService.AUTH_TAG_LENGTH,
    );
    const encrypted = data.subarray(
      EncryptionService.IV_LENGTH + EncryptionService.AUTH_TAG_LENGTH,
    );
    const decipher = createDecipheriv(EncryptionService.ALGORITHM, this.requireKey(), iv);
    decipher.setAuthTag(authTag);
    return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8');
  }

  /**
   * Check whether an encrypted `payload` decrypts to `plaintext`.
   *
   * Ciphertexts can't be compared directly (a random IV makes each encryption
   * of the same value unique), so the payload is decrypted and matched against
   * the candidate in constant time. Returns `false` — never throws — if the
   * payload is malformed, tampered with, or encrypted under a different key.
   */
  public compare(plaintext: string, payload: string): boolean {
    let decrypted: Buffer;
    try {
      decrypted = Buffer.from(this.decrypt(payload), 'utf8');
    } catch {
      return false;
    }

    const candidate = Buffer.from(plaintext, 'utf8');
    return decrypted.length === candidate.length && timingSafeEqual(decrypted, candidate);
  }

  /** Return the derived key or throw if `ENCRYPTION_KEY` was never configured. */
  private requireKey(): Buffer {
    if (!this.key) {
      throw new Error('ENCRYPTION_KEY is not configured; set it to use EncryptionService.');
    }
    return this.key;
  }
}

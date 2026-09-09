import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createCipheriv, createDecipheriv, randomBytes, scryptSync, timingSafeEqual } from 'crypto';

/**
 * Reversible AES-256-GCM for data you must recover later — never passwords, which belong in
 * `HashService`. Key derived via scrypt from `ENCRYPTION_KEY`; encrypt/decrypt throw without it.
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
   * Decrypt a payload from {@link encrypt}. Throws if the key is wrong or the
   * ciphertext or its auth tag was altered.
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
   * Whether `payload` decrypts to `plaintext`, compared in constant time. A random
   * IV makes ciphertexts incomparable directly. Returns `false` rather than throwing.
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

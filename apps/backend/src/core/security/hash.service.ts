import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';

/**
 * One-way hashing of secrets (passwords, tokens) with bcrypt.
 *
 * Hashing is deliberately slow and salted per value, so identical inputs
 * produce different hashes and brute-forcing is expensive. Store the string
 * returned by {@link hash} and verify candidates with {@link compare} — the
 * per-hash salt is embedded in the output, so no separate salt storage is
 * needed. This is one-way: hashes cannot be reversed. To store recoverable
 * data instead, use `EncryptionService`.
 */
@Injectable()
export class HashService {
  /** Cost factor (2^rounds). Higher is slower and more resistant to attack. */
  private readonly saltRounds: number;

  public constructor(config: ConfigService) {
    this.saltRounds = config.get<number>('hash.saltRounds', 10);
  }

  /**
   * Hash a plaintext value, generating a fresh salt at the configured cost.
   * The returned string embeds the algorithm, cost, and salt.
   */
  public hash(value: string): Promise<string> {
    return bcrypt.hash(value, this.saltRounds);
  }

  /**
   * Verify a plaintext value against a previously stored hash. Returns `true`
   * when they match. Safe against timing attacks (bcrypt compares in
   * constant time).
   */
  public compare(value: string, hashed: string): Promise<boolean> {
    return bcrypt.compare(value, hashed);
  }
}

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';

/**
 * One-way bcrypt hashing for passwords and tokens. The per-hash salt is embedded
 * in the output, so store only {@link hash}'s result and verify with {@link compare}.
 */
@Injectable()
export class HashService {
  /** Cost factor (2^rounds). Higher is slower and more resistant to attack. */
  private readonly saltRounds: number;

  public constructor(config: ConfigService) {
    this.saltRounds = config.get<number>('hash.saltRounds', 10);
  }

  /** Hash a value with a fresh salt at the configured cost. */
  public hash(value: string): Promise<string> {
    return bcrypt.hash(value, this.saltRounds);
  }

  /** Verify a value against a stored hash. Constant-time, per bcrypt. */
  public compare(value: string, hashed: string): Promise<boolean> {
    return bcrypt.compare(value, hashed);
  }
}

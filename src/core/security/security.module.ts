import { Global, Module } from '@nestjs/common';
import { EncryptionService } from './encryption.service';
import { HashService } from './hash.service';

/**
 * Provides the application's cryptographic services — {@link HashService} for
 * one-way hashing (passwords) and {@link EncryptionService} for reversible
 * encryption (recoverable secrets).
 *
 * Marked `@Global` so both can be injected anywhere without re-importing this
 * module, matching the app-wide availability of the other core infrastructure.
 */
@Global()
@Module({
  providers: [HashService, EncryptionService],
  exports: [HashService, EncryptionService],
})
export class SecurityModule {}

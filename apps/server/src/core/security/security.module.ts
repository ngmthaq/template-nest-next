import { Global, Module } from '@nestjs/common';

import { EncryptionService } from './encryption.service';
import { HashService } from './hash.service';

/**
 * Crypto services: {@link HashService} for one-way hashing (passwords),
 * {@link EncryptionService} for reversible encryption (recoverable secrets).
 */
@Global()
@Module({
  imports: [],
  exports: [HashService, EncryptionService],
  controllers: [],
  providers: [HashService, EncryptionService],
})
export class SecurityModule {}

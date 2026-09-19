import { ConfigModule } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';

import { EncryptionService } from './encryption.service';
import { HashService } from './hash.service';
import { SecurityModule } from './security.module';

describe('SecurityModule', () => {
  let moduleRef: TestingModule;

  beforeEach(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          ignoreEnvFile: true,
          load: [
            () => ({ hash: { saltRounds: 4 }, encryption: { key: 'test-key', salt: 'salt' } }),
          ],
        }),
        SecurityModule,
      ],
    }).compile();
  });

  afterEach(async () => {
    await moduleRef.close();
  });

  it('compiles and exposes HashService as an exported provider', () => {
    // Act
    const service = moduleRef.get(HashService);

    // Assert
    expect(service).toBeInstanceOf(HashService);
  });

  it('compiles and exposes EncryptionService as an exported provider', () => {
    // Act
    const service = moduleRef.get(EncryptionService);

    // Assert
    expect(service).toBeInstanceOf(EncryptionService);
  });
});

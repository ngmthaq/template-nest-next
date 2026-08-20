import { ConfigService } from '@nestjs/config';

import { EncryptionService } from './encryption.service';

describe('EncryptionService', () => {
  const createConfig = (key: string | undefined): ConfigService =>
    ({
      get: jest.fn<string | undefined, [string, string?]>((configKey, defaultValue) => {
        if (configKey === 'encryption.key') return key;
        if (configKey === 'encryption.salt') return 'test-salt';
        return defaultValue;
      }),
    }) as unknown as ConfigService;

  let service: EncryptionService;

  beforeEach(() => {
    service = new EncryptionService(createConfig('test-encryption-key'));
  });

  it('round-trips a plaintext string through encrypt and decrypt', () => {
    // Arrange
    const plaintext = 'sensitive-data';

    // Act
    const decrypted = service.decrypt(service.encrypt(plaintext));

    // Assert
    expect(decrypted).toBe(plaintext);
  });

  it('produces different ciphertexts for the same plaintext due to a random IV', () => {
    // Arrange
    const plaintext = 'same-input';

    // Act
    const [first, second] = [service.encrypt(plaintext), service.encrypt(plaintext)];

    // Assert
    expect(first).not.toBe(second);
  });

  it('returns true from compare when the plaintext matches the encrypted payload', () => {
    // Arrange
    const plaintext = 'match-me';
    const payload = service.encrypt(plaintext);

    // Act
    const result = service.compare(plaintext, payload);

    // Assert
    expect(result).toBe(true);
  });

  it('returns false from compare when the plaintext does not match the encrypted payload', () => {
    // Arrange
    const payload = service.encrypt('actual-value');

    // Act
    const result = service.compare('different-value', payload);

    // Assert
    expect(result).toBe(false);
  });

  it('returns false without throwing when the payload is malformed garbage', () => {
    // Arrange
    const garbage = 'not-a-valid-base64-payload!!';

    // Act
    const result = service.compare('anything', garbage);

    // Assert
    expect(result).toBe(false);
  });

  it('returns false without throwing when a genuine payload has been tampered with', () => {
    // Arrange
    const payload = service.encrypt('original-value');
    const tamperedChar = payload.at(-1) === 'A' ? 'B' : 'A';
    const tampered = payload.slice(0, -1) + tamperedChar;

    // Act
    const result = service.compare('original-value', tampered);

    // Assert
    expect(result).toBe(false);
  });

  it('throws an error mentioning ENCRYPTION_KEY when encrypting without a configured key', () => {
    // Arrange
    const unconfiguredService = new EncryptionService(createConfig(undefined));

    // Act
    const act = (): string => unconfiguredService.encrypt('plaintext');

    // Assert
    expect(act).toThrow(/ENCRYPTION_KEY/);
  });

  it('throws an error mentioning ENCRYPTION_KEY when decrypting without a configured key', () => {
    // Arrange
    const unconfiguredService = new EncryptionService(createConfig(undefined));

    // Act
    const act = (): string => unconfiguredService.decrypt('cGF5bG9hZA==');

    // Assert
    expect(act).toThrow(/ENCRYPTION_KEY/);
  });
});

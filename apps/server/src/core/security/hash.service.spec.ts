import { ConfigService } from '@nestjs/config';

import { HashService } from './hash.service';

describe('HashService', () => {
  let service: HashService;

  beforeEach(() => {
    // Low cost factor keeps bcrypt fast enough for the unit suite.
    const config = {
      get: jest.fn<number, [string, number?]>().mockReturnValue(4),
    } as unknown as ConfigService;
    service = new HashService(config);
  });

  it('verifies a hashed value against its original plaintext', async () => {
    // Arrange
    const plaintext = 'correct horse battery staple';
    const hashed = await service.hash(plaintext);

    // Act
    const result = await service.compare(plaintext, hashed);

    // Assert
    expect(result).toBe(true);
  });

  it('returns false when comparing a wrong value against a stored hash', async () => {
    // Arrange
    const hashed = await service.hash('right-password');

    // Act
    const result = await service.compare('wrong-password', hashed);

    // Assert
    expect(result).toBe(false);
  });

  it('produces different hashes for the same input due to per-value salting', async () => {
    // Arrange
    const plaintext = 'same-input';

    // Act
    const [first, second] = await Promise.all([service.hash(plaintext), service.hash(plaintext)]);

    // Assert
    expect(first).not.toBe(second);
  });
});

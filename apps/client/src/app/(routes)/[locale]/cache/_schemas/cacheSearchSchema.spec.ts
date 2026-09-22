import { createCacheSearchSchema, MAX_CACHE_PATTERN_LENGTH } from './cacheSearchSchema';

const t = vi.fn((key: string) => key) as unknown as Parameters<typeof createCacheSearchSchema>[0];

describe('cacheSearchSchema', () => {
  it('sets the max pattern length to 200', () => {
    // Arrange
    // Act
    // Assert
    expect(MAX_CACHE_PATTERN_LENGTH).toBe(200);
  });

  it('passes validation for a valid pattern', async () => {
    // Arrange
    const schema = createCacheSearchSchema(t);

    // Act
    const act = schema.validate({ pattern: 'user:*' });

    // Assert
    await expect(act).resolves.toEqual({ pattern: 'user:*' });
  });

  it('rejects an empty pattern with the required message', async () => {
    // Arrange
    const schema = createCacheSearchSchema(t);

    // Act
    const act = schema.validate({ pattern: '' });

    // Assert
    await expect(act).rejects.toThrow('formPatternRequired');
  });

  it('rejects a 201-character pattern with the too-long message', async () => {
    // Arrange
    const schema = createCacheSearchSchema(t);

    // Act
    const act = schema.validate({ pattern: 'a'.repeat(201) });

    // Assert
    await expect(act).rejects.toThrow('formPatternTooLong');
  });

  it('passes validation for a pattern exactly 200 characters long', async () => {
    // Arrange
    const schema = createCacheSearchSchema(t);
    const pattern = 'a'.repeat(200);

    // Act
    const act = schema.validate({ pattern });

    // Assert
    await expect(act).resolves.toEqual({ pattern });
  });
});

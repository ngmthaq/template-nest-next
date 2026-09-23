import {
  cacheDeleteResultSchema,
  cacheEntryListSchema,
  cacheEntrySchema,
} from './cacheResponseSchema';

const validateOptions = { stripUnknown: true, abortEarly: false };

describe('cacheResponseSchema', () => {
  describe('cacheEntrySchema', () => {
    it.each([
      ['an object', { nested: true }],
      ['null', null],
      ['a number', 42],
      ['a string', 'hello'],
    ])('accepts an entry whose value is %s', async (_label, value) => {
      // Arrange
      const entry = { key: 'user:1', value };

      // Act
      const act = cacheEntrySchema.validate(entry, validateOptions);

      // Assert
      await expect(act).resolves.toEqual(entry);
    });

    it('rejects an entry missing the value field', async () => {
      // Arrange
      const entry = { key: 'user:1' };

      // Act
      const act = cacheEntrySchema.validate(entry, validateOptions);

      // Assert
      await expect(act).rejects.toThrow(/value/);
    });

    it('rejects an entry missing the key field', async () => {
      // Arrange
      const entry = { value: 'anything' };

      // Act
      const act = cacheEntrySchema.validate(entry, validateOptions);

      // Assert
      await expect(act).rejects.toThrow(/key/);
    });

    it('removes an unknown field instead of rejecting the entry', async () => {
      // Arrange
      const entry = { key: 'user:1', value: 'x', extra: 'unexpected' };

      // Act
      const result = await cacheEntrySchema.validate(entry, validateOptions);

      // Assert
      expect(result).toEqual({ key: 'user:1', value: 'x' });
    });
  });

  describe('cacheEntryListSchema', () => {
    it('accepts an empty array', async () => {
      // Arrange
      const list: unknown[] = [];

      // Act
      const act = cacheEntryListSchema.validate(list, validateOptions);

      // Assert
      await expect(act).resolves.toEqual([]);
    });

    it('rejects a value that is not an array', async () => {
      // Arrange
      const notAList = { key: 'user:1', value: 'x' };

      // Act
      const act = cacheEntryListSchema.validate(notAList, validateOptions);

      // Assert
      await expect(act).rejects.toThrow();
    });
  });

  describe('cacheDeleteResultSchema', () => {
    it('accepts a result with key and deleted', async () => {
      // Arrange
      const result = { key: 'user:1', deleted: true };

      // Act
      const act = cacheDeleteResultSchema.validate(result, validateOptions);

      // Assert
      await expect(act).resolves.toEqual(result);
    });

    it('rejects a result missing the deleted field', async () => {
      // Arrange
      const result = { key: 'user:1' };

      // Act
      const act = cacheDeleteResultSchema.validate(result, validateOptions);

      // Assert
      await expect(act).rejects.toThrow(/deleted/);
    });
  });
});

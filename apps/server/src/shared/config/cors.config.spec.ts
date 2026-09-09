import { ConfigService } from '@nestjs/config';

import { buildCorsOptions, parseCorsOrigin } from './cors.config';

/** Build a `ConfigService` stub backed by a plain key/value map. */
function createConfigService(values: Record<string, unknown>): ConfigService {
  return {
    get: jest.fn((key: string, fallback?: unknown) => values[key] ?? fallback),
  } as unknown as ConfigService;
}

describe('parseCorsOrigin', () => {
  it('reflects the request origin when the value is undefined', () => {
    // Act
    const result = parseCorsOrigin(undefined);

    // Assert
    expect(result).toBe(true);
  });

  it('reflects the request origin when the value is blank', () => {
    // Act
    const result = parseCorsOrigin('   ');

    // Assert
    expect(result).toBe(true);
  });

  it('reflects the request origin when the value is a literal wildcard', () => {
    // Act
    const result = parseCorsOrigin('*');

    // Assert
    expect(result).toBe(true);
  });

  it('returns a single-entry allow-list for one explicit origin', () => {
    // Act
    const result = parseCorsOrigin('https://app.example.com');

    // Assert
    expect(result).toEqual(['https://app.example.com']);
  });

  it('splits a comma-separated value into a trimmed allow-list', () => {
    // Act
    const result = parseCorsOrigin(' https://app.example.com , https://admin.example.com ');

    // Assert
    expect(result).toEqual(['https://app.example.com', 'https://admin.example.com']);
  });

  it('drops empty entries left by trailing or repeated commas', () => {
    // Act
    const result = parseCorsOrigin('https://app.example.com,,');

    // Assert
    expect(result).toEqual(['https://app.example.com']);
  });
});

describe('buildCorsOptions', () => {
  it('applies the documented defaults when only an origin is configured', () => {
    // Arrange
    const config = createConfigService({ 'cors.origin': 'https://app.example.com' });

    // Act
    const result = buildCorsOptions(config);

    // Assert
    expect(result).toEqual({
      origin: ['https://app.example.com'],
      methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
      allowedHeaders: undefined,
      credentials: false,
      maxAge: undefined,
    });
  });

  it('passes through every configured CORS value', () => {
    // Arrange
    const config = createConfigService({
      'cors.origin': 'https://app.example.com',
      'cors.methods': 'GET,POST',
      'cors.allowedHeaders': 'Content-Type,Authorization',
      'cors.credentials': true,
      'cors.maxAge': 600,
    });

    // Act
    const result = buildCorsOptions(config);

    // Assert
    expect(result).toEqual({
      origin: ['https://app.example.com'],
      methods: 'GET,POST',
      allowedHeaders: 'Content-Type,Authorization',
      credentials: true,
      maxAge: 600,
    });
  });

  it('reflects any origin when credentials are disabled, which browsers treat as safe', () => {
    // Arrange
    const config = createConfigService({ 'cors.origin': '*', 'cors.credentials': false });

    // Act
    const result = buildCorsOptions(config);

    // Assert
    expect(result.origin).toBe(true);
  });

  it('throws when credentials are enabled alongside a wildcard origin', () => {
    // Arrange
    const config = createConfigService({ 'cors.origin': '*', 'cors.credentials': true });

    // Act
    const act = () => buildCorsOptions(config);

    // Assert
    expect(act).toThrow(/requires an explicit CORS_ORIGIN allow-list/);
  });

  it('throws when credentials are enabled and no origin is configured at all', () => {
    // Arrange
    const config = createConfigService({ 'cors.credentials': true });

    // Act
    const act = () => buildCorsOptions(config);

    // Assert
    expect(act).toThrow(/requires an explicit CORS_ORIGIN allow-list/);
  });

  it('allows credentials once the origin is an explicit allow-list', () => {
    // Arrange
    const config = createConfigService({
      'cors.origin': 'https://app.example.com',
      'cors.credentials': true,
    });

    // Act
    const result = buildCorsOptions(config);

    // Assert
    expect(result.origin).toEqual(['https://app.example.com']);
    expect(result.credentials).toBe(true);
  });
});

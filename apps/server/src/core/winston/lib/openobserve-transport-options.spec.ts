import {
  buildOpenObserveTransportOptions,
  OpenObserveLogConfig,
} from './openobserve-transport-options';

function buildConfig(overrides: Partial<OpenObserveLogConfig> = {}): OpenObserveLogConfig {
  return {
    url: 'http://openobserve.local:5080/otel',
    org: 'default',
    stream: 'server',
    ...overrides,
  };
}

describe('buildOpenObserveTransportOptions', () => {
  it('returns undefined when the url is not set', () => {
    // Arrange
    const config = buildConfig({ url: undefined });

    // Act
    const result = buildOpenObserveTransportOptions(config);

    // Assert
    expect(result).toBeUndefined();
  });

  it('sets ssl to false for an http url', () => {
    // Arrange
    const config = buildConfig({ url: 'http://openobserve.local:5080' });

    // Act
    const result = buildOpenObserveTransportOptions(config);

    // Assert
    expect(result?.ssl).toBe(false);
  });

  it('sets ssl to true for an https url', () => {
    // Arrange
    const config = buildConfig({ url: 'https://openobserve.local:5080' });

    // Act
    const result = buildOpenObserveTransportOptions(config);

    // Assert
    expect(result?.ssl).toBe(true);
  });

  it('parses the host and port from the url', () => {
    // Arrange
    const config = buildConfig({ url: 'https://openobserve.local:5080' });

    // Act
    const result = buildOpenObserveTransportOptions(config);

    // Assert
    expect(result?.host).toBe('openobserve.local');
    expect(result?.port).toBe(5080);
  });

  it('leaves port undefined when the url has no explicit port', () => {
    // Arrange
    const config = buildConfig({ url: 'https://openobserve.local' });

    // Act
    const result = buildOpenObserveTransportOptions(config);

    // Assert
    expect(result?.port).toBeUndefined();
  });

  it('builds the ingest path from the org and stream when the url has no base path', () => {
    // Arrange
    const config = buildConfig({
      url: 'https://openobserve.local',
      org: 'myorg',
      stream: 'mystream',
    });

    // Act
    const result = buildOpenObserveTransportOptions(config);

    // Assert
    expect(result?.path).toBe('/api/myorg/mystream/_json');
  });

  it('keeps the url base path in front of the ingest path', () => {
    // Arrange
    const config = buildConfig({
      url: 'https://openobserve.local/otel',
      org: 'myorg',
      stream: 'mystream',
    });

    // Act
    const result = buildOpenObserveTransportOptions(config);

    // Assert
    expect(result?.path).toBe('/otel/api/myorg/mystream/_json');
  });

  it('strips a trailing slash from the url base path before appending the ingest path', () => {
    // Arrange
    const config = buildConfig({
      url: 'https://openobserve.local/otel/',
      org: 'myorg',
      stream: 'mystream',
    });

    // Act
    const result = buildOpenObserveTransportOptions(config);

    // Assert
    expect(result?.path).toBe('/otel/api/myorg/mystream/_json');
  });

  it('omits auth when no user is set', () => {
    // Arrange
    const config = buildConfig({ user: undefined });

    // Act
    const result = buildOpenObserveTransportOptions(config);

    // Assert
    expect(result?.auth).toBeUndefined();
  });

  it('builds auth from the user and password when both are set', () => {
    // Arrange
    const config = buildConfig({ user: 'admin', password: 'secret' });

    // Act
    const result = buildOpenObserveTransportOptions(config);

    // Assert
    expect(result?.auth).toEqual({ username: 'admin', password: 'secret' });
  });

  it('defaults the auth password to an empty string when a user is set without a password', () => {
    // Arrange
    const config = buildConfig({ user: 'admin', password: undefined });

    // Act
    const result = buildOpenObserveTransportOptions(config);

    // Assert
    expect(result?.auth).toEqual({ username: 'admin', password: '' });
  });

  it('always enables batching with the fixed interval and count', () => {
    // Arrange
    const config = buildConfig();

    // Act
    const result = buildOpenObserveTransportOptions(config);

    // Assert
    expect(result?.batch).toBe(true);
    expect(result?.batchInterval).toBe(5000);
    expect(result?.batchCount).toBe(20);
  });
});

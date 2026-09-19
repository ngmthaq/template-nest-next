import { HttpService } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { Test } from '@nestjs/testing';

import { CoreHttpModule } from './core-http.module';

interface TestConfig {
  http?: {
    timeout?: number;
    maxRedirects?: number;
  };
}

async function buildAxiosDefaults(
  config: TestConfig,
): Promise<{ timeout?: number; maxRedirects?: number }> {
  const moduleRef = await Test.createTestingModule({
    imports: [
      ConfigModule.forRoot({ isGlobal: true, ignoreEnvFile: true, load: [() => config] }),
      CoreHttpModule,
    ],
  }).compile();

  const httpService = moduleRef.get(HttpService);
  const { timeout, maxRedirects } = httpService.axiosRef.defaults;
  await moduleRef.close();

  return { timeout, maxRedirects };
}

describe('CoreHttpModule', () => {
  it('applies the configured timeout and max redirects to the axios client', async () => {
    // Arrange
    const config: TestConfig = { http: { timeout: 12345, maxRedirects: 2 } };

    // Act
    const defaults = await buildAxiosDefaults(config);

    // Assert
    expect(defaults.timeout).toBe(12345);
    expect(defaults.maxRedirects).toBe(2);
  });

  it('falls back to a 60000ms timeout and 5 max redirects when http config is missing', async () => {
    // Arrange
    const config: TestConfig = {};

    // Act
    const defaults = await buildAxiosDefaults(config);

    // Assert
    expect(defaults.timeout).toBe(60000);
    expect(defaults.maxRedirects).toBe(5);
  });
});

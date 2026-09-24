import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import { getOptionsToken, ThrottlerGuard } from '@nestjs/throttler';

import { CoreThrottlerModule } from './core-throttler.module';

interface TestConfig {
  appEnv?: string;
  throttle?: {
    short?: Partial<{ ttl: number; limit: number }>;
    medium?: Partial<{ ttl: number; limit: number }>;
    long?: Partial<{ ttl: number; limit: number }>;
  };
}

interface ResolvedThrottlerOptions {
  skipIf: () => boolean;
  throttlers: Array<{ name: string; ttl: number; limit: number }>;
}

async function buildThrottlerOptions(config: TestConfig): Promise<ResolvedThrottlerOptions> {
  const moduleRef = await Test.createTestingModule({
    imports: [
      ConfigModule.forRoot({ isGlobal: true, ignoreEnvFile: true, load: [() => config] }),
      CoreThrottlerModule,
    ],
  }).compile();

  return moduleRef.get<ResolvedThrottlerOptions>(getOptionsToken());
}

describe('CoreThrottlerModule', () => {
  it('builds three named throttlers with the configured ttl and limit', async () => {
    // Arrange
    const config: TestConfig = {
      throttle: {
        short: { ttl: 500, limit: 2 },
        medium: { ttl: 5000, limit: 10 },
        long: { ttl: 30000, limit: 50 },
      },
    };

    // Act
    const options = await buildThrottlerOptions(config);

    // Assert
    expect(options.throttlers).toEqual([
      { name: 'short', ttl: 500, limit: 2 },
      { name: 'medium', ttl: 5000, limit: 10 },
      { name: 'long', ttl: 30000, limit: 50 },
    ]);
  });

  it('falls back to default ttl and limit values when throttle config is missing', async () => {
    // Act
    const options = await buildThrottlerOptions({});

    // Assert
    expect(options.throttlers).toEqual([
      { name: 'short', ttl: 1000, limit: 3 },
      { name: 'medium', ttl: 10000, limit: 20 },
      { name: 'long', ttl: 60000, limit: 100 },
    ]);
  });

  it('skips throttling when appEnv is missing (defaults to development)', async () => {
    // Act
    const options = await buildThrottlerOptions({});

    // Assert
    expect(options.skipIf()).toBe(true);
  });

  it('does not skip throttling when appEnv is production', async () => {
    // Act
    const options = await buildThrottlerOptions({ appEnv: 'production' });

    // Assert
    expect(options.skipIf()).toBe(false);
  });

  it('registers ThrottlerGuard as the global APP_GUARD', () => {
    // Arrange
    // Nest rewrites APP_GUARD to a per-instance UUID token at compile time, so the only
    // reliable check is the raw `providers` metadata the `@Module()` decorator stored.
    const providers = Reflect.getMetadata('providers', CoreThrottlerModule) as unknown[];

    // Act
    const guardProvider = providers.find(
      (provider): provider is { provide: string; useClass: unknown } =>
        typeof provider === 'object' && provider !== null && 'provide' in provider,
    );

    // Assert
    expect(guardProvider).toEqual({ provide: APP_GUARD, useClass: ThrottlerGuard });
  });
});

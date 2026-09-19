import { getSharedConfigToken } from '@nestjs/bullmq';
import { ConfigModule } from '@nestjs/config';
import { Test } from '@nestjs/testing';

import { CoreBullModule } from './core-bull.module';

interface TestConfig {
  redis?: {
    host?: string;
    port?: number;
    password?: string;
  };
}

interface BullConnection {
  host: string;
  port: number;
  password?: string;
}

async function buildBullConnection(config: TestConfig): Promise<BullConnection> {
  const moduleRef = await Test.createTestingModule({
    imports: [
      ConfigModule.forRoot({ isGlobal: true, ignoreEnvFile: true, load: [() => config] }),
      CoreBullModule,
    ],
  }).compile();

  const sharedConfig = moduleRef.get<{ connection: BullConnection }>(getSharedConfigToken());
  await moduleRef.close();

  return sharedConfig.connection;
}

describe('CoreBullModule', () => {
  it('builds the Redis connection from config values', async () => {
    // Arrange
    const config: TestConfig = { redis: { host: 'queue.local', port: 6390, password: 'secret' } };

    // Act
    const connection = await buildBullConnection(config);

    // Assert
    expect(connection).toEqual({ host: 'queue.local', port: 6390, password: 'secret' });
  });

  it('falls back to localhost:6379 with no password when redis config is missing', async () => {
    // Arrange
    const config: TestConfig = {};

    // Act
    const connection = await buildBullConnection(config);

    // Assert
    expect(connection).toEqual({ host: 'localhost', port: 6379, password: undefined });
  });
});

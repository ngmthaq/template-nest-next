import type { INestApplicationContext } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IoAdapter } from '@nestjs/platform-socket.io';

import { buildCorsOptions } from '../../shared/config/cors.config';
import { ConfiguredIoAdapter } from './websocket.adapter';

/** Build a `ConfigService` stub resolving keys from a plain lookup map. */
function createConfigService(values: Record<string, unknown>): ConfigService {
  return {
    get: jest.fn((key: string, defaultValue?: unknown) =>
      key in values ? values[key] : defaultValue,
    ),
  } as unknown as ConfigService;
}

/** Build a mock `INestApplicationContext` whose `get` resolves the given service. */
function createAppContext(configService: ConfigService): INestApplicationContext {
  return {
    get: jest.fn().mockReturnValue(configService),
  } as unknown as INestApplicationContext;
}

describe('ConfiguredIoAdapter', () => {
  let createIOServerSpy: jest.SpyInstance;

  beforeEach(() => {
    createIOServerSpy = jest.spyOn(IoAdapter.prototype, 'createIOServer').mockReturnValue({});
  });

  afterEach(() => {
    createIOServerSpy.mockRestore();
  });

  it('merges the shared CORS options into the options passed to the base createIOServer', () => {
    // Arrange
    const configService = createConfigService({
      'cors.origin': 'https://example.com',
      'cors.credentials': true,
    });
    const app = createAppContext(configService);
    const adapter = new ConfiguredIoAdapter(app);
    const expectedCorsOptions = buildCorsOptions(configService);

    // Act
    adapter.createIOServer(3000, { transports: ['websocket'] });

    // Assert
    expect(createIOServerSpy).toHaveBeenCalledWith(3000, {
      transports: ['websocket'],
      cors: expectedCorsOptions,
    });
  });
});

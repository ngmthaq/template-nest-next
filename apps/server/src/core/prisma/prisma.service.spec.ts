import { ConfigService } from '@nestjs/config';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';

import { PrismaService } from './prisma.service';

jest.mock('@prisma/adapter-mariadb', () => ({
  PrismaMariaDb: jest.fn(),
}));

jest.mock('../../generated/prisma/client', () => ({
  PrismaClient: class PrismaClientStub {
    public readonly $connect = jest.fn();
    public readonly $disconnect = jest.fn();
  },
}));

/** Build a `ConfigService` stub whose `getOrThrow` always resolves to `url`. */
function createConfigService(url: string): ConfigService {
  return {
    getOrThrow: jest.fn().mockReturnValue(url),
  } as unknown as ConfigService;
}

/** Shape of the mocked `$connect` / `$disconnect` jest fns exposed by the stubbed `PrismaClient`. */
interface MockedLifecycleMethods {
  $connect: jest.Mock;
  $disconnect: jest.Mock;
}

/** View a `PrismaService` instance as its mocked lifecycle jest fns, for assertions only. */
function asMockedLifecycle(service: PrismaService): MockedLifecycleMethods {
  return service as unknown as MockedLifecycleMethods;
}

describe('PrismaService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('constructs the MariaDB adapter from the configured database.url', () => {
    // Arrange
    const config = createConfigService('mysql://user:pass@localhost:3306/app_db');

    // Act
    new PrismaService(config);

    // Assert
    expect(PrismaMariaDb).toHaveBeenCalledWith('mysql://user:pass@localhost:3306/app_db');
  });

  it('calls $connect on module init', async () => {
    // Arrange
    const config = createConfigService('mysql://user:pass@localhost:3306/app_db');
    const service = new PrismaService(config);

    // Act
    await service.onModuleInit();

    // Assert
    expect(asMockedLifecycle(service).$connect).toHaveBeenCalled();
  });

  it('calls $disconnect on module destroy', async () => {
    // Arrange
    const config = createConfigService('mysql://user:pass@localhost:3306/app_db');
    const service = new PrismaService(config);

    // Act
    await service.onModuleDestroy();

    // Assert
    expect(asMockedLifecycle(service).$disconnect).toHaveBeenCalled();
  });
});

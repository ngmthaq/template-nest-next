import { ConfigModule } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';

import { PrismaModule } from './prisma.module';
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

describe('PrismaModule', () => {
  let moduleRef: TestingModule;

  beforeEach(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          ignoreEnvFile: true,
          load: [() => ({ database: { url: 'mysql://user:pass@localhost:3306/app_db' } })],
        }),
        PrismaModule,
      ],
    }).compile();
  });

  afterEach(async () => {
    await moduleRef.close();
  });

  it('compiles and exposes PrismaService as an exported provider', () => {
    // Act
    const service = moduleRef.get(PrismaService);

    // Assert
    expect(service).toBeInstanceOf(PrismaService);
  });
});

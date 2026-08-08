import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';

import { PrismaClient } from '../../generated/prisma/client';

/**
 * The application's Prisma database client.
 *
 * Extends the generated {@link PrismaClient} so every model delegate
 * (`prisma.user`, ...) is available directly on the injected service. Prisma 7
 * requires a driver adapter for the connection; the MariaDB adapter (compatible
 * with MySQL) is built from the `DATABASE_URL` resolved via `ConfigService`
 * (see `configuration.ts`).
 *
 * The connection is opened on module init and closed on shutdown, so callers
 * can inject `PrismaService` and query straight away.
 */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  public constructor(config: ConfigService) {
    super({ adapter: new PrismaMariaDb(config.getOrThrow<string>('database.url')) });
  }

  public async onModuleInit(): Promise<void> {
    await this.$connect();
    this.logger.log('Prisma connected to the database');
  }

  public async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}

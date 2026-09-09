import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';

import { PrismaClient } from '../../generated/prisma/client';

/**
 * The application's Prisma client, extended so every model delegate (`prisma.user`,
 * …) sits on the injected service. Connects on module init, disconnects on shutdown.
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

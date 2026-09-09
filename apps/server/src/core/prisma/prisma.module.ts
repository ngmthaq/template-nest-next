import { Global, Module } from '@nestjs/common';

import { PrismaService } from './prisma.service';

/** Provides the {@link PrismaService} database client. */
@Global()
@Module({
  imports: [],
  exports: [PrismaService],
  controllers: [],
  providers: [PrismaService],
})
export class PrismaModule {}

import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

/**
 * Provides the application's {@link PrismaService} database client. Its
 * connection is derived from `DATABASE_URL` via `ConfigService`; see
 * `configuration.ts`.
 *
 * Marked `@Global` so `PrismaService` can be injected anywhere without
 * re-importing, matching the app-wide availability of the other core
 * infrastructure.
 */
@Global()
@Module({
  imports: [],
  exports: [PrismaService],
  controllers: [],
  providers: [PrismaService],
})
export class PrismaModule {}

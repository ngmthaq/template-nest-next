import { Module } from '@nestjs/common';
import { CoreBullModule } from './bull/core-bull.module';
import { CoreCacheModule } from './cache/core-cache.module';
import { CoreConfigModule } from './config/core-config.module';
import { CoreEventEmitterModule } from './event-emitter/core-event-emitter.module';
import { CoreHttpModule } from './http/core-http.module';
import { CoreScheduleModule } from './schedule/core-schedule.module';
import { SecurityModule } from './security/security.module';
import { CoreThrottlerModule } from './throttler/core-throttler.module';
import { CoreWinstonModule } from './winston/core-winston.module';
import { WebsocketModule } from './websocket/websocket.module';

/**
 * Core module — wires up cross-cutting, application-wide infrastructure.
 *
 * Each concern lives in its own `Core*Module` under `src/core/`, all marked
 * `@Global` so their providers can be injected anywhere without re-importing:
 *
 * - {@link CoreConfigModule} — `@nestjs/config`, loading `.env.<NODE_ENV>`.
 * - {@link CoreWinstonModule} — the app-wide Winston logger.
 * - {@link CoreCacheModule} — the in-memory cache (`CACHE_MANAGER`).
 * - {@link CoreHttpModule} — `HttpService` for outbound HTTP calls.
 * - {@link CoreScheduleModule} — cron/interval/timeout scheduling.
 * - {@link CoreEventEmitterModule} — the application-wide event bus.
 * - {@link CoreBullModule} — the shared BullMQ Redis connection.
 * - {@link CoreThrottlerModule} — request rate limiting + global guard.
 * - {@link SecurityModule} — the `HashService` / `EncryptionService` crypto.
 * - {@link WebsocketModule} — the Socket.IO gateway for real-time features.
 */
@Module({
  imports: [
    CoreConfigModule,
    CoreWinstonModule,
    CoreCacheModule,
    CoreHttpModule,
    CoreScheduleModule,
    CoreEventEmitterModule,
    CoreBullModule,
    CoreThrottlerModule,
    SecurityModule,
    WebsocketModule,
  ],
  exports: [
    CoreConfigModule,
    CoreWinstonModule,
    CoreCacheModule,
    CoreHttpModule,
    CoreScheduleModule,
    CoreEventEmitterModule,
    CoreBullModule,
    CoreThrottlerModule,
    SecurityModule,
    WebsocketModule,
  ],
  controllers: [],
  providers: [],
})
export class CoreModule {}

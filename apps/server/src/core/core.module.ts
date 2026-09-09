import { Module } from '@nestjs/common';

import { CoreBullModule } from './bull/core-bull.module';
import { CoreCacheModule } from './cache/core-cache.module';
import { CoreConfigModule } from './config/core-config.module';
import { CoreEventEmitterModule } from './event-emitter/core-event-emitter.module';
import { CoreHttpModule } from './http/core-http.module';
import { MailModule } from './mail/mail.module';
import { PrismaModule } from './prisma/prisma.module';
import { CoreScheduleModule } from './schedule/core-schedule.module';
import { SecurityModule } from './security/security.module';
import { CoreThrottlerModule } from './throttler/core-throttler.module';
import { WebsocketModule } from './websocket/websocket.module';
import { CoreWinstonModule } from './winston/core-winston.module';

/**
 * Aggregates every cross-cutting `Core*Module`. All are `@Global`, so their
 * providers inject anywhere without re-importing this module.
 */
@Module({
  imports: [
    CoreConfigModule,
    PrismaModule,
    CoreWinstonModule,
    CoreCacheModule,
    CoreHttpModule,
    MailModule,
    CoreScheduleModule,
    CoreEventEmitterModule,
    CoreBullModule,
    CoreThrottlerModule,
    SecurityModule,
    WebsocketModule,
  ],
  exports: [
    CoreConfigModule,
    PrismaModule,
    CoreWinstonModule,
    CoreCacheModule,
    CoreHttpModule,
    MailModule,
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

import 'reflect-metadata';

import { CoreBullModule } from './bull/core-bull.module';
import { CoreCacheModule } from './cache/core-cache.module';
import { CoreConfigModule } from './config/core-config.module';
import { CoreModule } from './core.module';
import { CoreEventEmitterModule } from './event-emitter/core-event-emitter.module';
import { CoreHttpModule } from './http/core-http.module';
import { MailModule } from './mail/mail.module';
import { PrismaModule } from './prisma/prisma.module';
import { CoreScheduleModule } from './schedule/core-schedule.module';
import { SecurityModule } from './security/security.module';
import { CoreThrottlerModule } from './throttler/core-throttler.module';
import { WebsocketModule } from './websocket/websocket.module';
import { CoreWinstonModule } from './winston/core-winston.module';

// Jest can't resolve the generated client's `.js` imports, so stub it; importing
// the module is enough to load it.
jest.mock('../generated/prisma/client', () => ({
  PrismaClient: class PrismaClientStub {},
}));

describe('CoreModule', () => {
  it('imports every core infrastructure module', () => {
    // Arrange
    const expectedModules = [
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
    ];

    // Act
    const imports = Reflect.getMetadata('imports', CoreModule) as unknown[];

    // Assert
    expect(imports).toHaveLength(expectedModules.length);
    expect(imports).toEqual(expect.arrayContaining(expectedModules));
  });

  it('exports the same modules it imports', () => {
    // Arrange
    const expectedModules = [
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
    ];

    // Act
    const moduleExports = Reflect.getMetadata('exports', CoreModule) as unknown[];

    // Assert
    expect(moduleExports).toHaveLength(expectedModules.length);
    expect(moduleExports).toEqual(expect.arrayContaining(expectedModules));
  });
});

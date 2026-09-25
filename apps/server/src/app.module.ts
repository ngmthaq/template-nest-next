import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';

import { CoreModule } from './core/core.module';
import { FeatureModule } from './feature/feature.module';
import { RequestLoggerMiddleware } from './shared/middlewares/request-logger.middleware';

@Module({
  imports: [CoreModule, FeatureModule],
  exports: [],
  controllers: [],
  providers: [],
})
export class AppModule implements NestModule {
  /** Applies `RequestLoggerMiddleware` to every route, so all requests get logged. */
  public configure(consumer: MiddlewareConsumer): void {
    consumer.apply(RequestLoggerMiddleware).forRoutes('{*splat}');
  }
}

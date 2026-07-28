import { Global, Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';

/**
 * Sets up the application-wide event bus so any provider can dispatch events
 * with `EventEmitter2` and react with `@OnEvent`. Registered once here; no
 * events or listeners are defined at this layer.
 */
@Global()
@Module({
  imports: [EventEmitterModule.forRoot()],
  exports: [EventEmitterModule],
  controllers: [],
  providers: [],
})
export class CoreEventEmitterModule {}

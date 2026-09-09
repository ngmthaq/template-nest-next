import { Global, Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';

/** Application-wide event bus: dispatch with `EventEmitter2`, react with `@OnEvent`. */
@Global()
@Module({
  imports: [EventEmitterModule.forRoot()],
  exports: [EventEmitterModule],
  controllers: [],
  providers: [],
})
export class CoreEventEmitterModule {}

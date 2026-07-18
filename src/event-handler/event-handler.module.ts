import { Module } from '@nestjs/common';

/**
 * Centralizes application event listeners in one place.
 *
 * The event bus is registered globally in `CoreModule`
 * (`EventEmitterModule.forRoot()`), so the providers registered here can
 * subscribe to events with `@OnEvent(...)` without importing anything extra.
 */
@Module({
  providers: [],
})
export class EventHandlerModule {}

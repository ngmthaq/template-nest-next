import { Global, Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';

/**
 * Sets up the scheduler infrastructure so any provider can declare cron jobs,
 * intervals, or timeouts with `@Cron`, `@Interval`, and `@Timeout`. Registered
 * once here; no jobs are defined at this layer.
 */
@Global()
@Module({
  imports: [ScheduleModule.forRoot()],
  exports: [ScheduleModule],
  controllers: [],
  providers: [],
})
export class CoreScheduleModule {}

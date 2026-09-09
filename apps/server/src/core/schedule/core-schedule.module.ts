import { Global, Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';

/** Scheduler infrastructure for `@Cron`, `@Interval`, and `@Timeout`. No jobs defined here. */
@Global()
@Module({
  imports: [ScheduleModule.forRoot()],
  exports: [ScheduleModule],
  controllers: [],
  providers: [],
})
export class CoreScheduleModule {}

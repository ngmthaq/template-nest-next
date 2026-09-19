import { SchedulerRegistry } from '@nestjs/schedule';
import { Test, TestingModule } from '@nestjs/testing';

import { CoreScheduleModule } from './core-schedule.module';

describe('CoreScheduleModule', () => {
  let moduleRef: TestingModule;

  beforeEach(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [CoreScheduleModule],
    }).compile();
  });

  afterEach(async () => {
    await moduleRef.close();
  });

  it('compiles and exposes SchedulerRegistry through the re-exported ScheduleModule', () => {
    // Act
    const registry = moduleRef.get(SchedulerRegistry);

    // Assert
    expect(registry).toBeInstanceOf(SchedulerRegistry);
  });
});

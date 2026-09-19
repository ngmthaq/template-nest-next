import { EventEmitter2 } from '@nestjs/event-emitter';
import { Test, TestingModule } from '@nestjs/testing';

import { CoreEventEmitterModule } from './core-event-emitter.module';

describe('CoreEventEmitterModule', () => {
  let moduleRef: TestingModule;

  beforeEach(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [CoreEventEmitterModule],
    }).compile();
  });

  afterEach(async () => {
    await moduleRef.close();
  });

  it('compiles and exposes EventEmitter2 through the re-exported EventEmitterModule', () => {
    // Act
    const emitter = moduleRef.get(EventEmitter2);

    // Assert
    expect(emitter).toBeInstanceOf(EventEmitter2);
  });
});

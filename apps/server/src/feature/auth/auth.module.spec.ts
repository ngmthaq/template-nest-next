import { Test, TestingModule } from '@nestjs/testing';

import { AuthModule } from './auth.module';

describe('AuthModule', () => {
  let moduleRef: TestingModule;

  beforeEach(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [AuthModule],
    }).compile();
  });

  afterEach(async () => {
    await moduleRef.close();
  });

  it('compiles with no providers or controllers declared', () => {
    // Act
    const module = moduleRef.get(AuthModule);

    // Assert
    expect(module).toBeInstanceOf(AuthModule);
  });
});

import { Test, TestingModule } from '@nestjs/testing';

import { UserModule } from './user.module';

describe('UserModule', () => {
  let moduleRef: TestingModule;

  beforeEach(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [UserModule],
    }).compile();
  });

  afterEach(async () => {
    await moduleRef.close();
  });

  it('compiles with no providers or controllers declared', () => {
    // Act
    const module = moduleRef.get(UserModule);

    // Assert
    expect(module).toBeInstanceOf(UserModule);
  });
});

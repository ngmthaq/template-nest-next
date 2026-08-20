import { ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { NonProductionGuard } from './non-production.guard';

describe('NonProductionGuard', () => {
  const createGuard = (nodeEnv: string | undefined): NonProductionGuard => {
    const config = {
      get: jest.fn<string | undefined, [string, string?]>(
        (_key, defaultValue) => nodeEnv ?? defaultValue,
      ),
    } as unknown as ConfigService;
    return new NonProductionGuard(config);
  };

  it('throws ForbiddenException when the environment is production', () => {
    // Arrange
    const guard = createGuard('production');

    // Act
    const act = (): boolean => guard.canActivate();

    // Assert
    expect(act).toThrow(ForbiddenException);
  });

  it('allows access when the environment is development', () => {
    // Arrange
    const guard = createGuard('development');

    // Act
    const result = guard.canActivate();

    // Assert
    expect(result).toBe(true);
  });

  it('allows access when the environment is staging', () => {
    // Arrange
    const guard = createGuard('staging');

    // Act
    const result = guard.canActivate();

    // Assert
    expect(result).toBe(true);
  });

  it('allows access using the development default when nodeEnv is unset', () => {
    // Arrange
    const guard = createGuard(undefined);

    // Act
    const result = guard.canActivate();

    // Assert
    expect(result).toBe(true);
  });
});

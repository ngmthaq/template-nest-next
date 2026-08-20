import { INestApplication, ValidationPipe } from '@nestjs/common';

import { handleValidationPipe } from './validation.pipe';

/** Shape of the protected options `ValidationPipe` stores on itself at runtime. */
interface ValidationPipeInternals {
  isTransformEnabled: boolean;
  validatorOptions: { whitelist?: boolean; forbidNonWhitelisted?: boolean };
  transformOptions?: { enableImplicitConversion?: boolean };
}

describe('handleValidationPipe', () => {
  const createApp = (): {
    app: INestApplication;
    useGlobalPipes: jest.Mock<void, [ValidationPipe]>;
  } => {
    const useGlobalPipes = jest.fn<void, [ValidationPipe]>();
    const app = { useGlobalPipes } as unknown as INestApplication;
    return { app, useGlobalPipes };
  };

  it('registers exactly one global ValidationPipe on the application', () => {
    // Arrange
    const { app, useGlobalPipes } = createApp();

    // Act
    handleValidationPipe(app);

    // Assert
    expect(useGlobalPipes).toHaveBeenCalledTimes(1);
  });

  it('configures the pipe with whitelist, forbidNonWhitelisted, transform, and implicit conversion enabled', () => {
    // Arrange
    const { app, useGlobalPipes } = createApp();

    // Act
    handleValidationPipe(app);

    // Assert
    const [pipe] = useGlobalPipes.mock.calls[0];
    expect(pipe).toBeInstanceOf(ValidationPipe);
    const internals = pipe as unknown as ValidationPipeInternals;
    expect(internals.isTransformEnabled).toBe(true);
    expect(internals.validatorOptions.whitelist).toBe(true);
    expect(internals.validatorOptions.forbidNonWhitelisted).toBe(true);
    expect(internals.transformOptions?.enableImplicitConversion).toBe(true);
  });
});

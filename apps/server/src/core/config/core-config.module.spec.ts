import type { ConfigModuleOptions } from '@nestjs/config';

jest.mock('@nestjs/config', () => ({
  ConfigModule: { forRoot: jest.fn().mockReturnValue({}) },
}));

describe('CoreConfigModule', () => {
  const originalAppEnv = process.env.APP_ENV;

  afterEach(() => {
    if (originalAppEnv === undefined) {
      delete process.env.APP_ENV;
    } else {
      process.env.APP_ENV = originalAppEnv;
    }
  });

  /**
   * Sets `APP_ENV`, then re-requires the module in an isolated registry so its
   * `envFilePath` (computed once, at import time) picks up the new value.
   */
  function captureForRootOptions(appEnv: string | undefined): ConfigModuleOptions {
    let options!: ConfigModuleOptions;
    jest.isolateModules(() => {
      if (appEnv === undefined) {
        delete process.env.APP_ENV;
      } else {
        process.env.APP_ENV = appEnv;
      }
      // eslint-disable-next-line @typescript-eslint/no-require-imports -- isolateModules needs require, not a static import
      const { ConfigModule } = require('@nestjs/config') as {
        ConfigModule: { forRoot: jest.Mock<unknown, [ConfigModuleOptions]> };
      };
      // eslint-disable-next-line @typescript-eslint/no-require-imports -- ditto
      require('./core-config.module');
      [options] = ConfigModule.forRoot.mock.calls[0];
    });
    return options;
  }

  it('orders env files for development when APP_ENV is unset', () => {
    // Act
    const options = captureForRootOptions(undefined);

    // Assert
    expect(options.envFilePath).toEqual(['.env.development.local', '.env.development', '.env']);
  });

  it('orders env files for production when APP_ENV is production', () => {
    // Act
    const options = captureForRootOptions('production');

    // Assert
    expect(options.envFilePath).toEqual(['.env.production.local', '.env.production', '.env']);
  });

  it('sets isGlobal, cache and the configuration loader', () => {
    // Act
    const options = captureForRootOptions('test');

    // Assert
    expect(options.isGlobal).toBe(true);
    expect(options.cache).toBe(true);
    expect(options.load).toHaveLength(1);
  });
});

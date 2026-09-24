import { ConfigModule } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import * as winston from 'winston';

import { CoreWinstonModule } from './core-winston.module';

interface TestConfig {
  appEnv: string;
  log: {
    level: string;
    openobserve: {
      url?: string;
      org: string;
      stream: string;
      user?: string;
      password?: string;
    };
  };
}

async function buildLogger(config: TestConfig): Promise<winston.Logger> {
  const moduleRef = await Test.createTestingModule({
    imports: [
      ConfigModule.forRoot({ isGlobal: true, ignoreEnvFile: true, load: [() => config] }),
      CoreWinstonModule,
    ],
  }).compile();

  return moduleRef.get<winston.Logger>(WINSTON_MODULE_PROVIDER);
}

function buildTestConfig(openobserve: Partial<TestConfig['log']['openobserve']> = {}): TestConfig {
  return {
    appEnv: 'test',
    log: {
      level: 'debug',
      openobserve: { org: 'default', stream: 'server', ...openobserve },
    },
  };
}

describe('CoreWinstonModule', () => {
  it('only registers the console transport when no OpenObserve url is set', async () => {
    // Arrange
    const config = buildTestConfig();

    // Act
    const logger = await buildLogger(config);

    // Assert
    expect(logger.transports).toHaveLength(1);
    expect(logger.transports[0]).toBeInstanceOf(winston.transports.Console);
  });

  it('adds an Http transport to OpenObserve when a url is set', async () => {
    // Arrange
    const config = buildTestConfig({ url: 'http://openobserve.local:5080' });

    // Act
    const logger = await buildLogger(config);

    // Assert
    expect(logger.transports).toHaveLength(2);
    expect(logger.transports[1]).toBeInstanceOf(winston.transports.Http);
  });

  it('tags entries sent to the Http transport with service and env', async () => {
    // Arrange
    const loggedInfos: Record<string, unknown>[] = [];
    jest
      .spyOn(winston.transports.Http.prototype, 'log')
      .mockImplementation((...args: unknown[]) => {
        const [info, callback] = args as [Record<string, unknown>, () => void];
        loggedInfos.push(info);
        callback();
      });
    const config = buildTestConfig({ url: 'http://openobserve.local:5080' });
    const logger = await buildLogger(config);

    // Act
    logger.info('hello from the test');

    // Assert
    expect(loggedInfos).toHaveLength(1);
    expect(loggedInfos[0]).toMatchObject({ service: 'server', env: 'test' });
  });
});

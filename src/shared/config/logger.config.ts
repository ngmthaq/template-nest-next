import { ConfigService } from '@nestjs/config';
import { utilities as nestWinstonUtilities, WinstonModuleOptions } from 'nest-winston';
import * as winston from 'winston';

/**
 * Build the Winston options used as NestJS's application-wide logger.
 *
 * The minimum level is read from `ConfigService` (`log.level`, default `info`).
 * Non-production environments get a human-readable, colorized console format
 * that mirrors NestJS's native output (timestamp + context + level); production
 * emits structured JSON so logs can be shipped and parsed by log aggregators.
 *
 * Wired in `CoreModule` via `WinstonModule.forRootAsync` and attached in
 * `main.ts` through `app.useLogger(...)`, so both framework logs and every
 * standard `@nestjs/common` `Logger` call are routed through Winston.
 */
export function createWinstonOptions(config: ConfigService): WinstonModuleOptions {
  const level = config.get<string>('log.level', 'debug');
  const isProduction = config.get<string>('nodeEnv', 'development') === 'production';

  const format = isProduction
    ? winston.format.combine(winston.format.timestamp(), winston.format.json())
    : winston.format.combine(
        winston.format.timestamp(),
        winston.format.ms(),
        nestWinstonUtilities.format.nestLike('Nest', {
          colors: true,
          prettyPrint: true,
        }),
      );

  return {
    level,
    format,
    transports: [new winston.transports.Console()],
  };
}

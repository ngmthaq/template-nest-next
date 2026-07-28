import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { utilities as nestWinstonUtilities, WinstonModule } from 'nest-winston';
import * as winston from 'winston';

/**
 * Registers Winston as the application-wide logger, its options resolved from
 * `ConfigService`. Exposes the Nest-compatible logger provider that `main.ts`
 * attaches via `app.useLogger`, so all framework and application logs flow
 * through Winston.
 *
 * The minimum level is read from `ConfigService` (`log.level`, default `debug`).
 * Non-production environments get a human-readable, colorized console format
 * that mirrors NestJS's native output (timestamp + context + level); production
 * emits structured JSON so logs can be shipped and parsed by log aggregators.
 */
@Global()
@Module({
  imports: [
    WinstonModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
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
      },
    }),
  ],
  exports: [WinstonModule],
  controllers: [],
  providers: [],
})
export class CoreWinstonModule {}

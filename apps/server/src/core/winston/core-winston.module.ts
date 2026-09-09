import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { utilities as nestWinstonUtilities, WinstonModule } from 'nest-winston';
import * as winston from 'winston';

/**
 * Application-wide Winston logger, attached in `main.ts` via `app.useLogger`.
 * Production emits structured JSON for aggregators; elsewhere, colorized console.
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

import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { utilities as nestWinstonUtilities, WinstonModule } from 'nest-winston';
import * as winston from 'winston';

import { buildOpenObserveTransportOptions } from './lib/openobserve-transport-options';

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
        const nodeEnv = config.get<string>('nodeEnv', 'development');
        const isProduction = nodeEnv === 'production';
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

        const transportList: winston.transport[] = [new winston.transports.Console()];

        const openObserveOptions = buildOpenObserveTransportOptions({
          url: config.get<string>('log.openobserve.url'),
          org: config.get<string>('log.openobserve.org', 'default'),
          stream: config.get<string>('log.openobserve.stream', 'server'),
          user: config.get<string>('log.openobserve.user'),
          password: config.get<string>('log.openobserve.password'),
        });

        if (openObserveOptions) {
          transportList.push(
            new winston.transports.Http({
              ...openObserveOptions,
              // Tags each entry for OpenObserve; the logger-level `format` above already
              // added `timestamp`, and Nest's Logger already sets `context`.
              format: winston.format((info) => {
                info.service = 'server';
                info.env = nodeEnv;
                return info;
              })(),
            }),
          );
        }

        return {
          level,
          format,
          transports: transportList,
        };
      },
    }),
  ],
  exports: [WinstonModule],
  controllers: [],
  providers: [],
})
export class CoreWinstonModule {}

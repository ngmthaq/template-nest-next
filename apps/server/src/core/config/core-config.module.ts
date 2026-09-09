import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import configuration from './configuration';

/**
 * Global `ConfigService`, loading `.env.<NODE_ENV>` variants in order —
 * first file to define a variable wins.
 */
@Global()
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      load: [configuration],
      envFilePath: [
        `.env.${process.env.NODE_ENV ?? 'development'}.local`,
        `.env.${process.env.NODE_ENV ?? 'development'}`,
        '.env',
      ],
    }),
  ],
  exports: [ConfigModule],
  controllers: [],
  providers: [],
})
export class CoreConfigModule {}

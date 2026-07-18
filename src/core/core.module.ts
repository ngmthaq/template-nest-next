import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import configuration from './configuration';

/**
 * Core module — wires up cross-cutting, application-wide infrastructure.
 *
 * `ConfigModule` is registered here as a global module so `ConfigService`
 * can be injected anywhere without re-importing. Environment variables are
 * loaded from environment-specific `.env` files, resolved dynamically from
 * `NODE_ENV`. The lookup is ordered — the first file to define a variable
 * wins — so `.env.<NODE_ENV>` overrides the shared `.env` defaults.
 */
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
})
export class CoreModule {}

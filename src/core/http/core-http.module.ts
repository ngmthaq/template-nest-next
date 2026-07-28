import { HttpModule } from '@nestjs/axios';
import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Registers `@nestjs/axios` globally so `HttpService` can be injected anywhere
 * for outbound HTTP calls. Its Axios defaults (`timeout`, `maxRedirects`) are
 * resolved from `ConfigService`; see `configuration.ts`.
 */
@Global()
@Module({
  imports: [
    HttpModule.registerAsync({
      global: true,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        timeout: config.get<number>('http.timeout', 60000),
        maxRedirects: config.get<number>('http.maxRedirects', 5),
      }),
    }),
  ],
  exports: [HttpModule],
  controllers: [],
  providers: [],
})
export class CoreHttpModule {}

import { HttpModule } from '@nestjs/axios';
import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/** Global `HttpService` for outbound HTTP calls, with configured timeout and redirect limits. */
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

import { BullModule } from '@nestjs/bullmq';
import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Shared BullMQ Redis connection. Queues are registered per-feature with
 * `BullModule.registerQueue(...)`; none are defined here.
 */
@Global()
@Module({
  imports: [
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        connection: {
          host: config.get<string>('redis.host', 'localhost'),
          port: config.get<number>('redis.port', 6379),
          password: config.get<string>('redis.password'),
        },
      }),
    }),
  ],
  exports: [BullModule],
  controllers: [],
  providers: [],
})
export class CoreBullModule {}

import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CoreModule } from './core/core.module';
import { DevFeatureModule } from './dev-feature/dev-feature.module';
import { EventHandlerModule } from './event-handler/event-handler.module';
import { FeatureModule } from './feature/feature.module';

@Module({
  imports: [CoreModule, EventHandlerModule, FeatureModule, DevFeatureModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

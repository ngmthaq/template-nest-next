import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { handleVersioning } from './shared/config/versioning.config';
import { handleValidationPipe } from './shared/pipes/validation.pipe';

// Bootstrap the NestJS application.
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  handleValidationPipe(app);
  handleVersioning(app);
  const config = app.get(ConfigService);
  const port = config.get<number>('port', 3000);
  await app.listen(port);
}

void bootstrap();

import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { AppModule } from './app.module';
import { handleSwagger } from './shared/config/swagger.config';
import { handleVersioning } from './shared/config/versioning.config';
import { handleValidationPipe } from './shared/pipes/validation.pipe';

// Bootstrap the NestJS application.
async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.useLogger(app.get(WINSTON_MODULE_NEST_PROVIDER));
  app.use(cookieParser());
  app.use(compression());
  handleValidationPipe(app);
  handleVersioning(app);
  handleSwagger(app);
  const config = app.get(ConfigService);
  const port = config.get<number>('port', 3000);
  await app.listen(port);
}

void bootstrap();

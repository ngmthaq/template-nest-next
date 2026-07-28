import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { AppModule } from './app.module';
import { handleCompression } from './shared/config/compression.config';
import { handleCookieParser } from './shared/config/cookie-parser.config';
import { handleCors } from './shared/config/cors.config';
import { handleHelmet } from './shared/config/helmet.config';
import { handleGlobalPrefix } from './shared/config/prefix.config';
import { handleSwagger } from './shared/config/swagger.config';
import { handleVersioning } from './shared/config/versioning.config';
import { handleValidationPipe } from './shared/pipes/validation.pipe';
import { ConfiguredIoAdapter } from './core/websocket/websocket.adapter';

// Bootstrap the NestJS application.
async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  handleHelmet(app);
  handleCors(app);
  handleValidationPipe(app);
  handleGlobalPrefix(app);
  handleVersioning(app);
  handleSwagger(app);
  handleCookieParser(app);
  handleCompression(app);
  app.useLogger(app.get(WINSTON_MODULE_NEST_PROVIDER));
  app.useWebSocketAdapter(new ConfiguredIoAdapter(app));
  const config = app.get(ConfigService);
  const port = config.get<number>('port', 3000);
  await app.listen(port);
}

void bootstrap();

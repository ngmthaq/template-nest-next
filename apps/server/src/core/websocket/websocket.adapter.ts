import { INestApplicationContext } from '@nestjs/common';
import type { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';
import { ConfigService } from '@nestjs/config';
import { IoAdapter } from '@nestjs/platform-socket.io';
import type { Server, ServerOptions } from 'socket.io';

import { buildCorsOptions } from '../../shared/config/cors.config';

/**
 * Socket.IO adapter applying the app's shared CORS options, which `@WebSocketGateway()`
 * cannot do itself — it resolves its options before `ConfigService` exists.
 */
export class ConfiguredIoAdapter extends IoAdapter {
  private readonly corsOptions: CorsOptions;

  public constructor(app: INestApplicationContext) {
    super(app);
    this.corsOptions = buildCorsOptions(app.get(ConfigService));
  }

  public createIOServer(port: number, options?: ServerOptions): Server {
    return super.createIOServer(port, { ...options, cors: this.corsOptions }) as Server;
  }
}

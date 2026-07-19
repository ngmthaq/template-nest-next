import { INestApplicationContext } from '@nestjs/common';
import type { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';
import { ConfigService } from '@nestjs/config';
import { IoAdapter } from '@nestjs/platform-socket.io';
import type { Server, ServerOptions } from 'socket.io';
import { buildCorsOptions } from '../shared/config/cors.config';

/**
 * Socket.IO adapter that applies the application's shared CORS options to the
 * WebSocket server.
 *
 * The `@WebSocketGateway()` decorator resolves its options at class-definition
 * time, before `ConfigService` exists, so CORS cannot be configured there from
 * environment variables. This adapter instead injects the same
 * {@link buildCorsOptions} used by the REST layer when the Socket.IO server is
 * created — keeping cross-origin rules identical across transports and driven
 * by the `CORS_*` environment variables (see `configuration.ts`).
 *
 * Register it during bootstrap with
 * `app.useWebSocketAdapter(new ConfiguredIoAdapter(app))`.
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

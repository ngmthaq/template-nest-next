import { INestApplication } from '@nestjs/common';
import type { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';
import { ConfigService } from '@nestjs/config';

/**
 * Turn the configured `cors.origin` value into a value the underlying CORS
 * middleware understands.
 *
 * - `undefined`, empty, or `*` => `true`, which reflects the request's own
 *   `Origin` header. Reflecting (rather than the literal `*`) keeps CORS
 *   working even when `credentials` is enabled, since browsers reject the
 *   wildcard on credentialed requests.
 * - Anything else is treated as a comma-separated allow-list of exact origins.
 */
export function parseCorsOrigin(raw?: string): CorsOptions['origin'] {
  const value = raw?.trim();
  if (!value || value === '*') return true;

  return value
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}

/**
 * Build the shared {@link CorsOptions} from `ConfigService`.
 *
 * Both the REST layer (`app.enableCors`, see {@link handleCors}) and the
 * WebSocket layer (see `websocket.adapter.ts`) consume this so cross-origin
 * rules stay identical across transports and are driven from a single set of
 * `CORS_*` environment variables (see `configuration.ts`).
 */
export function buildCorsOptions(config: ConfigService): CorsOptions {
  return {
    origin: parseCorsOrigin(config.get<string>('cors.origin')),
    methods: config.get<string>('cors.methods', 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS'),
    allowedHeaders: config.get<string>('cors.allowedHeaders'),
    credentials: config.get<boolean>('cors.credentials', false),
    maxAge: config.get<number>('cors.maxAge'),
  };
}

/**
 * Enable Cross-Origin Resource Sharing for the HTTP (REST) layer.
 *
 * Applies the shared {@link buildCorsOptions} so REST and WebSocket honour the
 * same origins. Call during bootstrap before `app.listen(...)`.
 */
export function handleCors(app: INestApplication): void {
  app.enableCors(buildCorsOptions(app.get(ConfigService)));
}

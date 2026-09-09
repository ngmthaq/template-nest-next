import { INestApplication } from '@nestjs/common';
import type { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';
import { ConfigService } from '@nestjs/config';

/**
 * Turn `cors.origin` into a value the CORS middleware understands: `*`, empty, or unset
 * become `true` (reflect the caller's `Origin`); anything else is a comma-separated allow-list.
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
 * The shared {@link CorsOptions}, consumed by both REST and WebSocket so one policy covers both.
 * Throws when credentials meet a reflecting origin — see "CORS origins and credentials" in the README.
 */
export function buildCorsOptions(config: ConfigService): CorsOptions {
  const origin = parseCorsOrigin(config.get<string>('cors.origin'));
  const credentials = config.get<boolean>('cors.credentials', false);

  if (credentials && origin === true) {
    throw new Error(
      'CORS_CREDENTIALS=true requires an explicit CORS_ORIGIN allow-list. ' +
        'Reflecting any origin with credentials enabled exposes authenticated ' +
        'responses to every site; set CORS_ORIGIN to a comma-separated list of origins.',
    );
  }

  return {
    origin,
    methods: config.get<string>('cors.methods', 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS'),
    allowedHeaders: config.get<string>('cors.allowedHeaders'),
    credentials,
    maxAge: config.get<number>('cors.maxAge'),
  };
}

/** Enable CORS on the HTTP layer using the shared {@link buildCorsOptions}. */
export function handleCors(app: INestApplication): void {
  app.enableCors(buildCorsOptions(app.get(ConfigService)));
}

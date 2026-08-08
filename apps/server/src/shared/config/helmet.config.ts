import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';

/**
 * Apply Helmet security headers to the HTTP layer.
 *
 * Helmet sets a battery of hardening response headers (HSTS, X-Content-Type-
 * Options, X-Frame-Options, a restrictive Content-Security-Policy, etc.) with
 * sensible defaults. Register it early in bootstrap, before routes handle
 * requests, so every response carries the headers.
 *
 * Helmet's default CSP forbids the inline scripts/styles that Swagger UI ships,
 * which would break the docs. Swagger is only served outside production (see
 * `swagger.config.ts`), so the CSP is disabled there and kept on in production
 * where the docs are absent — every other Helmet protection stays enabled in
 * all environments.
 */
export function handleHelmet(app: INestApplication): void {
  const nodeEnv = app.get(ConfigService).get<string>('nodeEnv', 'development');
  const isProduction = nodeEnv === 'production';

  app.use(
    helmet({
      contentSecurityPolicy: isProduction ? undefined : false,
    }),
  );
}

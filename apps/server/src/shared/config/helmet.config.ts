import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';

/**
 * Apply Helmet's hardening headers. CSP is disabled outside production because Swagger UI's
 * inline scripts need it, and the docs are only served there; every other protection stays on.
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

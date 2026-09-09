import { INestApplication } from '@nestjs/common';

/** Path prefix prepended to every route, e.g. `GET /api/health`. */
export const GLOBAL_PREFIX = 'api';

/** Mount all routes under {@link GLOBAL_PREFIX}. The Swagger UI is registered separately. */
export function handleGlobalPrefix(app: INestApplication): void {
  app.setGlobalPrefix(GLOBAL_PREFIX);
}

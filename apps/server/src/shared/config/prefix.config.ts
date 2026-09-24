import { INestApplication } from '@nestjs/common';

/**
 * Path prefix prepended to every route. Empty means no prefix, e.g. `GET /health`.
 * Set it to a value such as `'api'` to add one back.
 */
export const GLOBAL_PREFIX = '';

/**
 * Mount all routes under {@link GLOBAL_PREFIX}, skipped when it is empty.
 * The Swagger UI is registered separately.
 */
export function handleGlobalPrefix(app: INestApplication): void {
  if (GLOBAL_PREFIX) app.setGlobalPrefix(GLOBAL_PREFIX);
}

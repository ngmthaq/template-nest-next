import { INestApplication } from '@nestjs/common';

/**
 * Global path prefix prepended to every route, e.g. `GET /api/health`.
 */
export const GLOBAL_PREFIX = 'api';

/**
 * Mount all application routes under the {@link GLOBAL_PREFIX} path.
 *
 * Applies to every controller so HTTP endpoints are served from `/api/...`.
 * The Swagger UI is registered separately and is not affected by this prefix.
 * Call before `app.listen(...)`.
 */
export function handleGlobalPrefix(app: INestApplication): void {
  app.setGlobalPrefix(GLOBAL_PREFIX);
}

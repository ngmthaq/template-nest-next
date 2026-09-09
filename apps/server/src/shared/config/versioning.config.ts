import { INestApplication, VersioningType } from '@nestjs/common';

/** Header carrying the requested API version, e.g. `X-API-Version: 1`. */
export const API_VERSION_HEADER = 'X-API-Version';

/** Version applied to routes without an explicit `@Version(...)`, and when the header is absent. */
export const DEFAULT_API_VERSION = '1';

/**
 * Enable header-based API versioning. Routes opt in with `@Version('2')`; undecorated ones
 * fall back to {@link DEFAULT_API_VERSION}, so existing endpoints keep working.
 */
export function handleVersioning(app: INestApplication): void {
  app.enableVersioning({
    type: VersioningType.HEADER,
    header: API_VERSION_HEADER,
    defaultVersion: DEFAULT_API_VERSION,
  });
}

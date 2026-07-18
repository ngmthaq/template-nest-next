import { INestApplication, VersioningType } from '@nestjs/common';

/**
 * HTTP header that carries the requested API version, e.g. `X-API-Version: 1`.
 */
export const API_VERSION_HEADER = 'X-API-Version';

/**
 * Default API version applied to routes that do not declare an explicit
 * `@Version(...)`, and used when a request omits the {@link API_VERSION_HEADER}.
 */
export const DEFAULT_API_VERSION = '1';

/**
 * Enable header-based API versioning application-wide.
 *
 * The requested version is read from the {@link API_VERSION_HEADER} header
 * (`X-API-Version`). Routes opt in per controller/handler via `@Version('2')`;
 * anything left undecorated falls back to {@link DEFAULT_API_VERSION}, so
 * existing endpoints keep working even when the header is absent.
 */
export function handleVersioning(app: INestApplication): void {
  app.enableVersioning({
    type: VersioningType.HEADER,
    header: API_VERSION_HEADER,
    defaultVersion: DEFAULT_API_VERSION,
  });
}

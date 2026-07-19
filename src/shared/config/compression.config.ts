import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import compression from 'compression';

/**
 * Enable gzip/deflate response compression.
 *
 * Responses at or above `threshold` bytes are compressed at the given zlib
 * `level` (0–9, or `-1` for zlib's default). Both are resolved from the
 * `COMPRESSION_*` environment variables (see `configuration.ts`) and default
 * to the `compression` library's own defaults (1 KB threshold, default level).
 */
export function handleCompression(app: INestApplication): void {
  const config = app.get(ConfigService);
  app.use(
    compression({
      threshold: config.get<number>('compression.threshold', 1024),
      level: config.get<number>('compression.level', -1),
    }),
  );
}

import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import compression from 'compression';

/**
 * gzip/deflate responses at or above `threshold` bytes, at the configured zlib `level`
 * (0–9, or `-1` for zlib's default).
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

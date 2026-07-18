import { INestApplication, ValidationPipe } from '@nestjs/common';

/**
 * Register a single application-wide {@link ValidationPipe} so every incoming
 * payload is validated against its DTO's `class-validator` decorators.
 *
 *   - whitelist: strip properties without validation decorators.
 *   - forbidNonWhitelisted: reject requests that carry unknown properties.
 *   - transform: instantiate DTO classes and coerce primitives to their
 *     declared types (e.g. path/query params to number/boolean).
 */
export function handleValidationPipe(app: INestApplication): void {
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );
}

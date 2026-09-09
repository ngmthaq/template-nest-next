import { INestApplication, ValidationPipe } from '@nestjs/common';

/**
 * One app-wide `ValidationPipe`: strips undecorated properties (`whitelist`), rejects unknown
 * ones (`forbidNonWhitelisted`), and instantiates DTOs coercing primitives (`transform`).
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

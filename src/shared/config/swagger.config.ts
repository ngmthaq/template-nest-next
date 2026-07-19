import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { API_VERSION_HEADER, DEFAULT_API_VERSION } from './versioning.config';

/**
 * Path where the interactive Swagger UI is served, e.g. `GET /docs`.
 * The raw OpenAPI JSON is available at `/{SWAGGER_PATH}-json`.
 */
export const SWAGGER_PATH = 'docs';

/**
 * Mount the OpenAPI (Swagger) documentation for the application.
 *
 * Builds the OpenAPI document by scanning every controller and its
 * `@nestjs/swagger` decorators, then serves the interactive UI at
 * {@link SWAGGER_PATH}. The `X-API-Version` header (see `versioning.config.ts`)
 * is registered as a global parameter so it can be set from the UI.
 *
 * Disabled in the production environment (`nodeEnv === 'production'`), so the
 * docs are never exposed there. Call after the global pipes/versioning are
 * configured but before `app.listen(...)`.
 */
export function handleSwagger(app: INestApplication): void {
  const nodeEnv = app.get(ConfigService).get<string>('nodeEnv', 'development');
  if (nodeEnv === 'production') return;

  const config = new DocumentBuilder()
    .setTitle('NestJS Template API')
    .setDescription('HTTP API reference for the NestJS template.')
    .setVersion(DEFAULT_API_VERSION)
    .addGlobalParameters({
      in: 'header',
      required: false,
      name: API_VERSION_HEADER,
      description: 'Requested API version.',
      schema: {
        type: 'string',
        default: DEFAULT_API_VERSION,
      },
    })
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup(SWAGGER_PATH, app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });
}

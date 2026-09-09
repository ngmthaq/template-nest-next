import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

import { API_VERSION_HEADER, DEFAULT_API_VERSION } from './versioning.config';

/** Where the Swagger UI is served; raw OpenAPI JSON sits at `/{SWAGGER_PATH}-json`. */
export const SWAGGER_PATH = 'swagger';

/**
 * Mount the OpenAPI docs, built by scanning controllers and their `@nestjs/swagger` decorators.
 * Not mounted in production, so the docs are never exposed there.
 */
export function handleSwagger(app: INestApplication): void {
  const nodeEnv = app.get(ConfigService).get<string>('nodeEnv', 'development');
  if (nodeEnv === 'production') return;

  const config = new DocumentBuilder()
    .setTitle('Template Nest Next API')
    .setDescription('HTTP API reference for the Template Nest Next server.')
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
    jsonDocumentUrl: `/${SWAGGER_PATH}-json`,
    yamlDocumentUrl: `/${SWAGGER_PATH}-yaml`,
    swaggerOptions: {
      persistAuthorization: true,
    },
  });
}

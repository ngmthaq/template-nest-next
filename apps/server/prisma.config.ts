import { config as loadEnv } from 'dotenv';
import { defineConfig } from 'prisma/config';

import { buildDatabaseUrl } from './src/core/config/database-url';

// Mirrors the app's env-loading order (see core-config.module.ts).
const appEnv = process.env.APP_ENV ?? 'development';
loadEnv({ path: [`.env.${appEnv}.local`, `.env.${appEnv}`, '.env'] });

export default defineConfig({
  schema: 'prisma/schema',
  migrations: {
    path: 'prisma/migrations',
    seed: 'tsx prisma/seed.ts',
  },
  datasource: {
    // Composed from the MYSQL_* vars, the single source of truth.
    url: buildDatabaseUrl(),
  },
});

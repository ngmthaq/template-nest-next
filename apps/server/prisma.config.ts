import { config as loadEnv } from 'dotenv';
import { defineConfig } from 'prisma/config';

import { buildDatabaseUrl } from './src/core/config/database-url';

// Mirror the app's env-loading order (see src/core/config/core-config.module.ts):
// `.env.<NODE_ENV>.local` overrides `.env.<NODE_ENV>` overrides `.env`.
const nodeEnv = process.env.NODE_ENV ?? 'development';
loadEnv({ path: [`.env.${nodeEnv}.local`, `.env.${nodeEnv}`, '.env'] });

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

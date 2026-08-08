import { config as loadEnv } from 'dotenv';

/**
 * Loads the per-environment .env files into process.env, mirroring apps/server.
 *
 * `APP_ENV` (set by the start scripts) selects which files load. First file to
 * define a variable wins — dotenv does not override already-set variables — so
 * the order below matches the server's ConfigModule envFilePath:
 *   1. .env.<APP_ENV>.local   (git-ignored, secrets/overrides)
 *   2. .env.<APP_ENV>         (committed, shared per-environment defaults)
 *   3. .env                   (git-ignored, local fallback)
 */
export function loadAppEnv() {
  const appEnv = process.env.APP_ENV ?? 'development';
  for (const path of [`.env.${appEnv}.local`, `.env.${appEnv}`, '.env']) {
    loadEnv({ path, override: false, quiet: true });
  }
}

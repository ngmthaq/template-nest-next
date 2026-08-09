import { config as loadEnv } from 'dotenv';

export function loadAppEnv() {
  const appEnv = process.env.APP_ENV ?? 'development';
  for (const path of [`.env.${appEnv}.local`, `.env.${appEnv}`, '.env']) {
    loadEnv({ path, override: false, quiet: true });
  }
}

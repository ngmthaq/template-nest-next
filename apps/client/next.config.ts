import type { NextConfig } from 'next';

import { loadAppEnv } from './load-env.mjs';

// Load per-environment .env files (see load-env.mjs) for `next build`, which
// does not go through the load-env-cli.mjs launcher. dev/start already have them
// loaded by the time this runs, and dotenv won't override existing values.
loadAppEnv();

const nextConfig: NextConfig = {
  cacheComponents: true,
  cacheLife: {
    api: { stale: 60, revalidate: 300, expire: 3600 },
    apiShort: { stale: 10, revalidate: 30, expire: 300 },
    apiLong: { stale: 300, revalidate: 86400, expire: 604800 },
    apiPrivate: { stale: 300 },
  },
};

export default nextConfig;

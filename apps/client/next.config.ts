import type { NextConfig } from 'next';

import { loadAppEnv } from './load-env.mjs';

// Load per-environment .env files (see load-env.mjs) for `next build`, which
// does not go through the load-env-cli.mjs launcher. dev/start already have them
// loaded by the time this runs, and dotenv won't override existing values.
loadAppEnv();

const nextConfig: NextConfig = {/* config options here */};

export default nextConfig;

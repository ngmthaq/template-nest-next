import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

import { loadAppEnv } from './load-env.mjs';

loadAppEnv();

const nextConfig: NextConfig = {
  experimental: {
    globalNotFound: true,
  },
  cacheComponents: true,
  cacheLife: {
    api: { stale: 60, revalidate: 300, expire: 3600 },
    apiShort: { stale: 10, revalidate: 30, expire: 300 },
    apiLong: { stale: 300, revalidate: 86400, expire: 604800 },
    apiPrivate: { stale: 300 },
  },
};

const withNextIntl = createNextIntlPlugin('./app/(shared)/_libs/next-intl/configs/request.ts');

export default withNextIntl(nextConfig);

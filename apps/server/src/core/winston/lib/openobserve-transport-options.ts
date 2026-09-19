import type * as winston from 'winston';

/** OpenObserve connection settings, matching `log.openobserve` in `configuration.ts`. */
export interface OpenObserveLogConfig {
  url?: string;
  org: string;
  stream: string;
  user?: string;
  password?: string;
}

/**
 * Builds Winston `Http` transport options that post batches to OpenObserve's `_json` ingest
 * endpoint. Returns `undefined` when no URL is set, so the caller can skip the transport.
 */
export function buildOpenObserveTransportOptions(
  config: OpenObserveLogConfig,
): winston.transports.HttpTransportOptions | undefined {
  if (!config.url) return undefined;

  const parsed = new URL(config.url);
  const basePath = parsed.pathname.replace(/\/+$/, '');

  return {
    ssl: parsed.protocol === 'https:',
    host: parsed.hostname,
    port: parsed.port ? Number(parsed.port) : undefined,
    path: `${basePath}/api/${config.org}/${config.stream}/_json`,
    auth: config.user ? { username: config.user, password: config.password ?? '' } : undefined,
    batch: true,
    batchInterval: 5000,
    batchCount: 20,
  };
}

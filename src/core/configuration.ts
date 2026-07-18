/**
 * Application configuration factory.
 *
 * Values are read from environment variables (populated from the matching
 * `.env` file by `ConfigModule`) and exposed as a strongly-typed object.
 * Access them via `ConfigService`, e.g. `config.get('port')`.
 */
export default () => ({
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: parseInt(process.env.PORT ?? '3000', 10),
  log: {
    level: process.env.LOG_LEVEL ?? 'debug',
  },
  cache: {
    ttl: parseInt(process.env.CACHE_TTL ?? '3600000', 10),
    max: parseInt(process.env.CACHE_MAX ?? '100', 10),
  },
  http: {
    timeout: parseInt(process.env.HTTP_TIMEOUT ?? '60000', 10),
    maxRedirects: parseInt(process.env.HTTP_MAX_REDIRECTS ?? '5', 10),
  },
  redis: {
    host: process.env.REDIS_HOST ?? 'localhost',
    port: parseInt(process.env.REDIS_PORT ?? '6379', 10),
    password: process.env.REDIS_PASSWORD || undefined,
  },
});

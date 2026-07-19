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
  cors: {
    origin: process.env.CORS_ORIGIN ?? '*',
    methods: process.env.CORS_METHODS ?? 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: process.env.CORS_ALLOWED_HEADERS || undefined,
    credentials: process.env.CORS_CREDENTIALS === 'true',
    maxAge: process.env.CORS_MAX_AGE ? parseInt(process.env.CORS_MAX_AGE, 10) : undefined,
  },
  throttle: {
    short: {
      ttl: parseInt(process.env.THROTTLE_SHORT_TTL ?? '1000', 10),
      limit: parseInt(process.env.THROTTLE_SHORT_LIMIT ?? '3', 10),
    },
    medium: {
      ttl: parseInt(process.env.THROTTLE_MEDIUM_TTL ?? '10000', 10),
      limit: parseInt(process.env.THROTTLE_MEDIUM_LIMIT ?? '20', 10),
    },
    long: {
      ttl: parseInt(process.env.THROTTLE_LONG_TTL ?? '60000', 10),
      limit: parseInt(process.env.THROTTLE_LONG_LIMIT ?? '100', 10),
    },
  },
  cookie: {
    secret: process.env.COOKIE_SECRET || undefined,
  },
  compression: {
    threshold: parseInt(process.env.COMPRESSION_THRESHOLD ?? '1024', 10),
    level: parseInt(process.env.COMPRESSION_LEVEL ?? '-1', 10),
  },
  hash: {
    saltRounds: parseInt(process.env.HASH_SALT_ROUNDS ?? '10', 10),
  },
  encryption: {
    key: process.env.ENCRYPTION_KEY || undefined,
    salt: process.env.ENCRYPTION_SALT ?? 'salt',
  },
  redis: {
    host: process.env.REDIS_HOST ?? 'localhost',
    port: parseInt(process.env.REDIS_PORT ?? '6379', 10),
    password: process.env.REDIS_PASSWORD || undefined,
  },
});

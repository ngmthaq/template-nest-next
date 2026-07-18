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
});

/**
 * Build the MySQL connection string Prisma needs from the individual `MYSQL_*`
 * environment variables, keeping them the single source of truth for the
 * database credentials (no separate `DATABASE_URL`). User and password are
 * URL-encoded so special characters survive.
 */
export function buildDatabaseUrl(env: NodeJS.ProcessEnv = process.env): string {
  const host = env.MYSQL_HOST ?? 'localhost';
  const port = env.MYSQL_PORT ?? '3306';
  const user = encodeURIComponent(env.MYSQL_USER ?? 'root');
  const password = encodeURIComponent(env.MYSQL_PASSWORD ?? '');
  const database = env.MYSQL_DATABASE ?? '';
  return `mysql://${user}:${password}@${host}:${port}/${database}`;
}

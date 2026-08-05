import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { config as loadEnv } from 'dotenv';
import { buildDatabaseUrl } from '../src/core/config/database-url';
import { PrismaClient } from '../src/generated/prisma/client';

// Load env the same way the app does, so the seed can also be run directly
// (e.g. `tsx prisma/seed.ts`), not only via `prisma db seed`.
const nodeEnv = process.env.NODE_ENV ?? 'development';
loadEnv({ path: [`.env.${nodeEnv}.local`, `.env.${nodeEnv}`, '.env'] });

const prisma = new PrismaClient({ adapter: new PrismaMariaDb(buildDatabaseUrl()) });

// Sample data. `upsert` keyed on the unique email makes the seed idempotent,
// so it can be re-run without creating duplicates.
const users = [
  { email: 'alice@example.com', name: 'Alice' },
  { email: 'bob@example.com', name: 'Bob' },
  { email: 'carol@example.com', name: 'Carol' },
];

async function main(): Promise<void> {
  for (const user of users) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: { name: user.name },
      create: user,
    });
  }
  console.log(`Seeded ${users.length} users.`);
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => {
    void prisma.$disconnect();
  });

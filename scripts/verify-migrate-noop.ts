/**
 * Verify that drizzle-orm's migrate() is a no-op against the configured DB.
 * This proves the journal backfill produced correct hashes.
 *
 * Run with:
 *   DATABASE_URL=<branch-uri> npx tsx scripts/verify-migrate-noop.ts
 */
import { drizzle } from 'drizzle-orm/neon-http';
import { migrate } from 'drizzle-orm/neon-http/migrator';
import { neon, neonConfig } from '@neondatabase/serverless';

neonConfig.fetchConnectionCache = true;
neonConfig.poolQueryViaFetch = true;
neonConfig.fetchEndpoint = (host) => {
  const protocol = host.includes('localhost') ? 'http' : 'https';
  return `${protocol}://${host}/sql`;
};

const url =
  process.env.DATABASE_URL_UNPOOLED ||
  process.env.POSTGRES_URL_NON_POOLING ||
  process.env.DATABASE_URL;

if (!url) {
  console.error('DATABASE_URL not set');
  process.exit(1);
}

const sqlClient = neon(url);
const db = drizzle(sqlClient);

async function main(): Promise<void> {
  const beforeBooks = (await sqlClient.query(
    'SELECT COUNT(*)::int AS n FROM generated_books',
  )) as Array<{ n: number }>;
  const beforeRows = (await sqlClient.query(
    'SELECT COUNT(*)::int AS n FROM drizzle.__drizzle_migrations',
  )) as Array<{ n: number }>;

  console.log(
    `[verify] before: ${beforeBooks[0]?.n} books, ${beforeRows[0]?.n} drizzle.__drizzle_migrations rows`,
  );

  console.log('[verify] running drizzle-orm migrate()…');
  await migrate(db, { migrationsFolder: './migrations' });

  const afterBooks = (await sqlClient.query(
    'SELECT COUNT(*)::int AS n FROM generated_books',
  )) as Array<{ n: number }>;
  const afterRows = (await sqlClient.query(
    'SELECT COUNT(*)::int AS n FROM drizzle.__drizzle_migrations',
  )) as Array<{ n: number }>;

  console.log(
    `[verify] after:  ${afterBooks[0]?.n} books, ${afterRows[0]?.n} drizzle.__drizzle_migrations rows`,
  );

  const booksDelta = (afterBooks[0]?.n ?? 0) - (beforeBooks[0]?.n ?? 0);
  const rowsDelta = (afterRows[0]?.n ?? 0) - (beforeRows[0]?.n ?? 0);

  if (booksDelta === 0 && rowsDelta === 0) {
    console.log('[verify] ✓ migrate() was a no-op — backfill is correct');
  } else {
    console.error(
      `[verify] ✗ unexpected change: booksDelta=${booksDelta}, rowsDelta=${rowsDelta}`,
    );
    process.exit(2);
  }
}

main().catch((err) => {
  console.error('[verify] failed:', err);
  process.exit(1);
});

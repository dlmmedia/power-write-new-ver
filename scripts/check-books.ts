/**
 * Quick sanity check: count books in the DB and show top 5, mirroring the
 * SELECT used by the /api/books route.
 */
import { neon, neonConfig } from '@neondatabase/serverless';

neonConfig.fetchConnectionCache = true;
neonConfig.poolQueryViaFetch = true;
neonConfig.fetchEndpoint = (host) => {
  const protocol = host.includes('localhost') ? 'http' : 'https';
  return `${protocol}://${host}/sql`;
};

const connectionString =
  process.env.DATABASE_URL_UNPOOLED ||
  process.env.POSTGRES_URL_NON_POOLING ||
  process.env.DATABASE_URL;

if (!connectionString) {
  console.error('DATABASE_URL not set');
  process.exit(1);
}

const sql = neon(connectionString);

async function main(): Promise<void> {
  const totalRows = await sql.query('SELECT COUNT(*)::int AS n FROM generated_books');
  const total = totalRows[0]?.n ?? 0;
  console.log(`Total books in DB: ${total}`);

  const sample = await sql.query(
    'SELECT id, user_id, title, author, status, series_id, created_at FROM generated_books ORDER BY created_at DESC LIMIT 5'
  );
  console.log('\nMost recent 5 books:');
  for (const row of sample) {
    console.log(
      `  #${row.id}  user=${row.user_id?.substring(0, 16)}…  status=${row.status}  series=${row.series_id ?? '-'}  ${row.title}`
    );
  }

  const usersRows = await sql.query(
    'SELECT user_id, COUNT(*)::int AS n FROM generated_books GROUP BY user_id ORDER BY n DESC LIMIT 10'
  );
  console.log('\nBooks per user:');
  for (const row of usersRows) {
    console.log(`  ${row.user_id}: ${row.n}`);
  }
}

main().catch((err) => {
  console.error('Failed:', err);
  process.exit(1);
});

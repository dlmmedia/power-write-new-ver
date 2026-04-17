/**
 * Inspect the live database schema for tables we care about.
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
  const tables = await sql.query(
    `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name`
  );
  console.log('Tables in public schema:');
  for (const row of tables) console.log(`  - ${row.table_name}`);

  const targetTables = ['generated_books', 'book_chapters', 'book_series', 'book_bibliography', 'video_export_jobs', 'users'];
  for (const t of targetTables) {
    const cols = await sql.query(
      `SELECT column_name, data_type, is_nullable, column_default FROM information_schema.columns WHERE table_schema='public' AND table_name=$1 ORDER BY ordinal_position`,
      [t]
    );
    console.log(`\n=== ${t} (${cols.length} columns) ===`);
    for (const c of cols) {
      console.log(`  ${c.column_name.padEnd(28)} ${c.data_type}${c.is_nullable === 'NO' ? ' NOT NULL' : ''}${c.column_default ? ` DEFAULT ${c.column_default}` : ''}`);
    }
  }

  const constraints = await sql.query(
    `SELECT tc.table_name, tc.constraint_name, tc.constraint_type
     FROM information_schema.table_constraints tc
     WHERE tc.table_schema='public'
       AND tc.table_name IN ('book_chapters','generated_books')
       AND tc.constraint_type IN ('UNIQUE','PRIMARY KEY')
     ORDER BY tc.table_name, tc.constraint_name`
  );
  console.log('\nConstraints:');
  for (const c of constraints) console.log(`  ${c.table_name}.${c.constraint_name} (${c.constraint_type})`);
}

main().catch((err) => {
  console.error('Failed:', err);
  process.exit(1);
});

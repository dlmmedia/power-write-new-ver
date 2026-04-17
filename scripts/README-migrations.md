# Database migrations — operating procedure

> **TL;DR** — never auto-migrate. Always: backup → plan → apply → verify.

This project uses [Drizzle ORM](https://orm.drizzle.team/) for schema and
migrations against a Neon Postgres database. Phase 2A introduced a strict,
backup-first protocol because the books table holds irreplaceable user content.

## Hard rules

1. **No `drizzle-kit push`** against any environment that has user data. It
   compares schema directly and applies arbitrary `ALTER`/`DROP` without
   review. We use `drizzle-kit generate` + reviewed SQL only.
2. **No automatic migration on server startup.** The `instrumentation-node.ts`
   boot hook is read-only — it logs drift, never fixes it.
3. **Take a Neon backup branch before any DB write.** Backup branches are
   instant, free, and give you a one-click revert path.
4. **Additive SQL only** unless explicitly approved. Prefer
   `ADD COLUMN IF NOT EXISTS`, `CREATE TABLE IF NOT EXISTS`,
   `CREATE INDEX IF NOT EXISTS`. Never `DROP COLUMN` or `DROP TABLE` on shared
   environments without an approved deprecation runbook.
5. **Always run `npm run db:migrate` (no `--confirm`) first.** It prints a
   plan and refuses to apply. Only re-run with `npm run db:migrate:apply`
   after reviewing the plan and creating the backup branch.

## Day-to-day workflow

### A. Adding a new column / table (typical)

```bash
# 1. Edit lib/db/schema.ts (e.g. add a column to a table)

# 2. Generate the migration SQL
npm run db:generate

# 3. REVIEW the new file under migrations/ — make sure no DROPs slipped in
#    and that columns are nullable / have defaults so existing rows survive.

# 4. Take a backup branch (via Neon MCP, dashboard, or API)

# 5. Plan
npm run db:migrate
# → prints pending migrations and refuses to apply

# 6. Apply
npm run db:migrate:apply

# 7. Confirm
npm run db:migrate:verify     # runs migrate() again, must be no-op
```

### B. Applying a hand-written SQL file (legacy path)

The old approach is still supported via
`scripts/apply-pending-migrations.ts` for ad-hoc, idempotent SQL files. After
applying, you must register the file in `_journal.json` and add a hash row to
`drizzle.__drizzle_migrations` so future drizzle runs don't try to re-apply.
The cleanest way is to re-run `npm run db:migrate:backfill` which appends any
new SQL files to the journal and inserts hash rows.

## What Phase 2A changed

Before Phase 2A:

- `_journal.json` only listed two of eight migration files.
- `drizzle.__drizzle_migrations` table did not exist at all.
- A blind `drizzle-kit migrate` would have tried to re-apply every migration
  from scratch and almost certainly destroyed or duplicated data.

After Phase 2A:

- `_journal.json` lists all eight existing files.
- `drizzle.__drizzle_migrations` is populated with hashes for all eight.
- `npm run db:migrate` correctly reports `no pending migrations`.
- `drizzle-kit generate` will produce `0007_*.sql` next, with no name
  conflicts.

## What Phase 2F changed (driver swap)

`lib/db/index.ts` switched from `drizzle-orm/neon-http` (one HTTP request per
statement) to `drizzle-orm/neon-serverless` (Pool over WebSockets). This:

- enables real `db.transaction(...)` blocks (rollback works),
- reuses connections across requests (Railway runs a long-lived Node process),
- removes per-statement HTTP overhead.

Connection target is unchanged: still `DATABASE_URL_UNPOOLED`. We deliberately
do **not** use Neon's pooled (`-pooler`) endpoint with our client-side Pool —
PgBouncer in transaction mode would conflict with prepared statements,
advisory locks, and some transaction semantics.

If you ever need to inspect the Pool driver:

```bash
npm run db:verify-pool
# Confirms: plain query, tx commit, tx rollback all work.
```

### Pool tuning (env-overridable)

| Var                     | Default | Notes                                                    |
| ----------------------- | ------- | -------------------------------------------------------- |
| `DB_POOL_MAX`           | `10`    | Max connections in the pool.                             |
| `DB_POOL_IDLE_MS`       | `30000` | Recycle conns idle this long.                            |
| `DB_POOL_CONNECT_MS`    | `10000` | How long a query waits for a free conn before failing.   |

### macOS dev-only DNS workaround

The driver calls `dns.setDefaultResultOrder('ipv4first')` at module load.
Without this, macOS `getaddrinfo` can intermittently fail to follow Neon's
CNAME chain over WebSockets (only — fetch / undici uses a different DNS
path). Linux/Railway is unaffected; the call is a harmless no-op there.

## Scripts

| Command                            | Purpose                                                                 |
| ---------------------------------- | ----------------------------------------------------------------------- |
| `npm run db:generate`              | `drizzle-kit generate` — diffs schema vs. last snapshot, writes new SQL |
| `npm run db:migrate`               | Plan-only. Lists pending migrations, refuses to apply.                  |
| `npm run db:migrate:apply`         | Applies pending migrations. Use only after backup + plan review.        |
| `npm run db:migrate:verify`        | Sanity-runs `migrate()` and asserts it was a no-op.                     |
| `npm run db:migrate:backfill:dry`  | Dry run of journal/DB backfill.                                         |
| `npm run db:migrate:backfill`      | Adds any unjournalled SQL files to `_journal.json` + hash rows.         |
| `npm run db:verify-pool`           | Smoke-tests the Pool driver (plain query, tx commit, tx rollback).      |
| `npm run db:studio`                | Opens drizzle-studio.                                                   |

## Restore from a backup branch

If something goes wrong, you can either:

- Reset the main branch to the backup branch via Neon's `reset_from_parent`
  (one click in dashboard or via Neon MCP), or
- Switch your `DATABASE_URL` temporarily to point at the backup branch
  while you investigate.

The backup branches created during Phase 2A are kept forever (Neon retains
them until you delete them). Document any branch you create and the reason
for it, and prune obsolete ones occasionally.

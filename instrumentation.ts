/**
 * Next.js instrumentation hook. Runs once per server process boot.
 *
 * This is a thin shim. ALL Node-only logic (DB drivers, env loader) lives in
 * `instrumentation-node.ts` and is imported lazily so the edge runtime bundle
 * never reaches it.
 *
 * SAFETY GUARANTEE — see instrumentation-node.ts for the full contract:
 *   - No CREATE/ALTER/DROP, no INSERT/UPDATE/DELETE, no migration runner.
 *   - All checks are read-only and findings are logged only.
 */

export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./instrumentation-node');
  }
}

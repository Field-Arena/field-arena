/**
 * Refuses to let a destructive script touch a Supabase project unless it is
 * clearly not production.
 *
 * Allowed:
 *   - a local Supabase (localhost / 127.0.0.1 / [::1] / host.docker.internal), or
 *   - a hosted project whose ref is listed in FA_SCRIPT_ALLOWED_PROJECT_REFS
 *     (comma-separated, set in your shell or .env.local) AND the command was
 *     run with --i-know-this-is-not-prod.
 *
 * Both conditions are needed for a hosted project on purpose: the allowlist
 * says which projects are scratch/dev, the flag says the person running it
 * meant to point at one. Never put the production project's ref in the
 * allowlist.
 */

export const NOT_PROD_FLAG = '--i-know-this-is-not-prod';

const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]', '::1', 'host.docker.internal']);

/** The project ref of a hosted Supabase URL (https://<ref>.supabase.co), else null. */
export function projectRefFromUrl(url) {
  try {
    const host = new URL(url).hostname;
    const match = /^([a-z0-9]+)\.supabase\.(co|in)$/.exec(host);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

export function isLocalSupabaseUrl(url) {
  try {
    return LOCAL_HOSTS.has(new URL(url).hostname);
  } catch {
    return false;
  }
}

function allowedRefs() {
  return (process.env.FA_SCRIPT_ALLOWED_PROJECT_REFS ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * Exits the process unless the target is safe. Pass `url` for scripts that
 * talk to the database API, or `ref` for ones that go through the Management
 * API by project ref.
 */
export function assertSafeTarget({ script, url, ref, argv = process.argv }) {
  if (url && isLocalSupabaseUrl(url)) return;

  const targetRef = ref ?? (url ? projectRefFromUrl(url) : null);
  const refs = allowedRefs();
  const flagged = argv.includes(NOT_PROD_FLAG);

  if (targetRef && flagged && refs.includes(targetRef)) {
    console.warn(`[${script}] target ${targetRef} is allowlisted and ${NOT_PROD_FLAG} was passed.`);
    return;
  }

  const target = targetRef ?? url ?? '(unknown target)';
  console.error(
    [
      `[${script}] refusing to run against ${target}.`,
      '',
      'This script writes demo data or deletes rows. It only runs against:',
      '  - a local Supabase (http://localhost:54321 etc.), or',
      `  - a hosted project listed in FA_SCRIPT_ALLOWED_PROJECT_REFS, with ${NOT_PROD_FLAG}.`,
      '',
      refs.length === 0
        ? 'FA_SCRIPT_ALLOWED_PROJECT_REFS is empty.'
        : `Allowlisted refs: ${refs.join(', ')}${flagged ? '' : ` (and ${NOT_PROD_FLAG} was not passed)`}`,
      'Never allowlist the production project.',
    ].join('\n'),
  );
  process.exit(1);
}

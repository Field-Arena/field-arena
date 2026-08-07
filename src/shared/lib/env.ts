/**
 * Typed environment access with fail-fast checks.
 *
 * The public values are read through STATIC `process.env.NEXT_PUBLIC_*`
 * references, and that is not a style preference. Next.js replaces these at
 * build time by substituting the literal text `process.env.NEXT_PUBLIC_FOO`
 * wherever it appears. A computed lookup — `process.env[key]` — cannot be
 * matched by that substitution, so it survives into the browser bundle as a
 * property read against an object that does not carry those keys client-side.
 * The result is `undefined` at runtime in the browser even when the variable is
 * set correctly, which the previous version of this file then turned into a
 * thrown "Missing required environment variable" the moment any client component
 * called createClient().
 *
 * Server-only values may be looked up dynamically, since no bundler
 * substitution is involved — but they are written statically too, for symmetry
 * and so a grep for the variable name finds its use site.
 */

function required(value: string | undefined, name: string): string {
  if (!value) {
    throw new Error(
      `Missing required environment variable: ${name}. ` +
        `Copy .env.local.example to .env.local and fill it in.`
    );
  }
  return value;
}

export const env = {
  /** Safe in the browser — inlined at build time. */
  get supabaseUrl(): string {
    return required(process.env.NEXT_PUBLIC_SUPABASE_URL, 'NEXT_PUBLIC_SUPABASE_URL');
  },

  /** Safe in the browser. RLS is what protects the data, not the secrecy of this key. */
  get supabaseAnonKey(): string {
    return required(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, 'NEXT_PUBLIC_SUPABASE_ANON_KEY');
  },

  /**
   * Server only. Bypasses RLS entirely, so reading this in code that could ever
   * run in the browser would hand every visitor unrestricted database access.
   * There is no NEXT_PUBLIC_ prefix precisely so the bundler cannot inline it.
   */
  get supabaseServiceRoleKey(): string {
    return required(process.env.SUPABASE_SERVICE_ROLE_KEY, 'SUPABASE_SERVICE_ROLE_KEY');
  },

  /** Absolute origin, used to build auth redirect URLs. */
  get siteUrl(): string {
    return process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
  },

  /**
   * Server only. Used for direct calls to Resend's REST API (transactional
   * email outside of Supabase Auth's own SMTP-based flows — see
   * modules/shows/data/horses-mutations.ts's reminder email for the first,
   * and so far only, caller).
   */
  get resendApiKey(): string {
    return required(process.env.RESEND_API_KEY, 'RESEND_API_KEY');
  },

  /** Server only. Refunds and off-session additional charges — see shared/lib/stripe.ts. */
  get stripeSecretKey(): string {
    return required(process.env.STRIPE_SECRET_KEY, 'STRIPE_SECRET_KEY');
  },

  /**
   * Server only. Verifies that a POST to app/api/webhooks/stripe genuinely
   * came from Stripe (stripe.webhooks.constructEvent) rather than trusting an
   * unsigned request body claiming an order was paid. Distinct per endpoint in
   * the Stripe Dashboard, so this is its own variable rather than reusing
   * STRIPE_SECRET_KEY.
   */
  get stripeWebhookSecret(): string {
    return required(process.env.STRIPE_WEBHOOK_SECRET, 'STRIPE_WEBHOOK_SECRET');
  },
} as const;

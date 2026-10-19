function required(value: string | undefined, name: string): string {
  if (!value) {
    throw new Error(
      `Missing required environment variable: ${name}. ` +
        `Copy .env.local.example to .env.local and fill it in.`,
    );
  }
  return value;
}

export const env = {
  get supabaseUrl(): string {
    return required(process.env.NEXT_PUBLIC_SUPABASE_URL, 'NEXT_PUBLIC_SUPABASE_URL');
  },

  get supabaseAnonKey(): string {
    return required(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, 'NEXT_PUBLIC_SUPABASE_ANON_KEY');
  },

  get supabaseServiceRoleKey(): string {
    return required(process.env.SUPABASE_SERVICE_ROLE_KEY, 'SUPABASE_SERVICE_ROLE_KEY');
  },

  /* Base URL for auth redirects, Stripe return URLs and email links. A silent
   * localhost fallback in production sends riders' magic links and Stripe
   * redirects to http://localhost:3000, so on Vercel production it is required.
   * Previews fall back to their own deployment URL; local dev and CI (no
   * Vercel env) to localhost. VERCEL_ENV is server-only and
   * NEXT_PUBLIC_VERCEL_ENV is what Vercel exposes to the browser bundle — both
   * read so client components (run-show-card) apply the same rule. */
  get siteUrl(): string {
    const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
    if (configured) return configured.replace(/\/+$/, '');

    const vercelEnv = process.env.VERCEL_ENV ?? process.env.NEXT_PUBLIC_VERCEL_ENV;
    if (vercelEnv === 'production') {
      return required(undefined, 'NEXT_PUBLIC_SITE_URL');
    }
    if (vercelEnv === 'preview' && process.env.VERCEL_URL) {
      return `https://${process.env.VERCEL_URL}`;
    }
    return 'http://localhost:3000';
  },

  get resendApiKey(): string {
    return required(process.env.RESEND_API_KEY, 'RESEND_API_KEY');
  },

  get stripeSecretKey(): string {
    return required(process.env.STRIPE_SECRET_KEY, 'STRIPE_SECRET_KEY');
  },

  get stripeWebhookSecret(): string {
    return required(process.env.STRIPE_WEBHOOK_SECRET, 'STRIPE_WEBHOOK_SECRET');
  },
} as const;

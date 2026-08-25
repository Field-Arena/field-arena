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

  get siteUrl(): string {
    return process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
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

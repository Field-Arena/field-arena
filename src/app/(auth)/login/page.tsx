import type { Metadata } from 'next';
import Link from 'next/link';
import { LoginForm } from '@/modules/auth/ui/login-form';

export const metadata: Metadata = {
  title: 'Sign in — Field & Arena',
};

/**
 * The route middleware redirects unauthenticated users to, and where invite and
 * password-reset links land. The header also renders the same LoginForm in a
 * dialog, which is closer to how the legacy app behaved — but a route has to
 * exist regardless, because a redirect and an emailed link both need a URL.
 */
export default function LoginPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-cream px-5 py-12">
      <div className="w-full max-w-[420px]">
        <Link
          href="/"
          className="mb-8 flex items-center justify-center gap-3 text-hunter-deep no-underline"
        >
          <span className="grid size-11 place-items-center rounded-xl bg-hunter-deep font-serif font-bold text-gold">
            F&amp;A
          </span>
          <span className="font-serif text-xl font-bold">Field &amp; Arena</span>
        </Link>

        <div className="rounded-2xl border border-border bg-white p-7 shadow-[0_18px_60px_rgba(13,44,35,0.10)]">
          <h1 className="mb-1 font-serif text-2xl font-bold text-hunter-deep">Sign in</h1>
          <p className="text-fa-muted mb-6 text-sm">
            Welcome back. Sign in to reach your workspace.
          </p>

          <LoginForm />
        </div>
      </div>
    </main>
  );
}

import Link from 'next/link';
import { ROUTES } from '@/shared/constants/routes';

/** Shown by the dashboard layout when the signed-in profile can't be loaded. */
export function WorkspaceUnavailable() {
  return (
    <main className="bg-cream grid min-h-screen place-items-center px-5 py-12">
      <div className="border-border w-full max-w-[520px] rounded-2xl border bg-white p-8 shadow-[0_18px_60px_rgba(13,44,35,0.10)]">
        <h1 className="text-hunter-deep mb-2 font-serif text-2xl font-bold">
          We couldn&rsquo;t load your workspace
        </h1>
        <p className="text-fa-muted mb-6 text-[15px] leading-relaxed">
          Something went wrong reaching your account. This is usually brief — try again in a moment.
        </p>
        <div className="flex flex-wrap gap-3">
          <a
            href={ROUTES.dashboard}
            className="bg-hunter-deep rounded-lg px-4 py-2.5 text-sm font-semibold text-white"
          >
            Try again
          </a>
          <Link
            href={ROUTES.home}
            prefetch={false}
            className="border-border text-ink rounded-lg border bg-white px-4 py-2.5 text-sm font-semibold"
          >
            Go to home page
          </Link>
        </div>
      </div>
    </main>
  );
}

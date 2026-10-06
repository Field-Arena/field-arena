import type { Metadata } from 'next';
import Link from 'next/link';
import { ROUTES } from '@/shared/constants/routes';

export const metadata: Metadata = { title: 'Page not found — Field & Arena' };

export default function NotFound() {
  return (
    <main className="bg-cream grid min-h-screen place-items-center px-5 py-12">
      <div className="max-w-[480px] text-center">
        <p className="text-fa-muted mb-3 text-[13px] font-semibold tracking-[.14em] uppercase">
          404
        </p>
        <h1 className="text-hunter-deep mb-3 font-serif text-3xl font-bold">Page not found</h1>
        <p className="text-fa-muted mb-7 text-[15px] leading-relaxed">
          The page you&rsquo;re looking for doesn&rsquo;t exist or has moved.
        </p>
        <Link
          href={ROUTES.home}
          className="bg-hunter-deep inline-block rounded-lg px-5 py-2.5 text-sm font-semibold text-white"
        >
          Back to Field &amp; Arena
        </Link>
      </div>
    </main>
  );
}

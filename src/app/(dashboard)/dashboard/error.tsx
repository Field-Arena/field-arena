'use client';

import Link from 'next/link';
import { Button } from '@/shared/ui/shadcn/button';

export default function DashboardError({
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  return (
    <section role="alert" className="border-line space-y-4 rounded-xl border bg-white p-6">
      <h1 className="text-hunter-deep font-serif text-2xl">This screen couldn’t be loaded</h1>
      <p className="text-fa-muted text-sm">
        Try loading it again, or use the navigation to open another screen. If you were saving
        changes, check their status before submitting them again.
      </p>
      <div className="flex flex-wrap gap-3">
        <Button type="button" onClick={unstable_retry}>
          Try again
        </Button>
        <Button variant="outline" asChild>
          <Link href="/dashboard">Back to workspace</Link>
        </Button>
      </div>
    </section>
  );
}

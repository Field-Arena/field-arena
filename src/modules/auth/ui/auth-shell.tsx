import Link from 'next/link';
import type { ReactNode } from 'react';
import { LockIcon } from 'lucide-react';
import { AuthAside } from '@/modules/auth/ui/auth-aside';
import { LoginTrigger } from '@/modules/auth/ui/login-trigger';
import { LoginDialog } from '@/modules/auth/ui/login-dialog';
import { StepMarker } from '@/modules/auth/ui/step-marker';
import { MobileBrand } from '@/modules/auth/ui/mobile-brand';

/**
 * The split layout both auth screens share: forest panel on the left, form on
 * the right. Server-rendered — only the form inside it is a client component.
 */
export function AuthShell({
  children,
  step,
  alternate,
}: {
  children: ReactNode;
  /** The two-step progress marker. Omitted by sign-in, which is one step. */
  step?: 1 | 2;
  /** The "already have an account" link in the top-right. `dialog` opens the sign-in overlay instead of navigating. */
  alternate?: { label: string; href: string; dialog?: boolean };
}) {
  return (
    <div className="fa-public grid min-h-dvh font-[family-name:var(--font-ar)] text-ink-deep lg:grid-cols-[minmax(0,1.02fr)_minmax(0,1fr)]">
      <AuthAside />

      <main className="flex flex-col items-center bg-paper px-6 py-12 md:px-10">
        <div className="mb-auto flex w-full max-w-[424px] items-center justify-between gap-5">
          {step ? <StepMarker current={step} /> : <MobileBrand />}
          {alternate &&
            (alternate.dialog ? (
              <LoginTrigger className="text-[13px] font-semibold text-fa-muted transition-colors hover:text-gold">
                {alternate.label}
              </LoginTrigger>
            ) : (
              <Link
                href={alternate.href}
                className="text-[13px] font-semibold text-fa-muted transition-colors hover:text-gold"
              >
                {alternate.label}
              </Link>
            ))}
        </div>

        <div className="my-10 w-full max-w-[424px]">{children}</div>

        <div className="mt-auto flex w-full max-w-[424px] items-center justify-center gap-2">
          <LockIcon className="size-[13px] text-[#9AA6A0]" aria-hidden />
          <span className="text-[11.5px] font-medium tracking-[.04em] text-[#9AA6A0]">
            Secured by Supabase Auth
          </span>
        </div>
      </main>

      <LoginDialog />
    </div>
  );
}

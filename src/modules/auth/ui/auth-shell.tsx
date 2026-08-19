import Link from 'next/link';
import type { ReactNode } from 'react';
import { LockIcon } from 'lucide-react';
import { AuthAside } from '@/modules/auth/ui/auth-aside';
import { LoginTrigger } from '@/modules/auth/ui/login-trigger';
import { LoginDialog } from '@/modules/auth/ui/login-dialog';
import { StepMarker } from '@/modules/auth/ui/step-marker';
import { MobileBrand } from '@/modules/auth/ui/mobile-brand';

export function AuthShell({
  children,
  step,
  alternate,
}: {
  children: ReactNode;

  step?: 1 | 2;

  alternate?: { label: string; href: string; dialog?: boolean };
}) {
  return (
    <div className="fa-public text-ink-deep grid min-h-dvh font-[family-name:var(--font-ar)] lg:grid-cols-[minmax(0,1.02fr)_minmax(0,1fr)]">
      <AuthAside />

      <main className="bg-paper flex flex-col items-center px-6 py-12 md:px-10">
        <div className="mb-auto flex w-full max-w-[424px] items-center justify-between gap-5">
          {step ? <StepMarker current={step} /> : <MobileBrand />}
          {alternate &&
            (alternate.dialog ? (
              <LoginTrigger className="text-fa-muted hover:text-gold text-[13px] font-semibold transition-colors">
                {alternate.label}
              </LoginTrigger>
            ) : (
              <Link
                href={alternate.href}
                className="text-fa-muted hover:text-gold text-[13px] font-semibold transition-colors"
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

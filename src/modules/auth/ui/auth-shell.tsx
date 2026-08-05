import Link from 'next/link';
import type { ReactNode } from 'react';
import { LockIcon } from 'lucide-react';
import { AuthAside } from './auth-aside';
import { LoginTrigger } from './login-trigger';
import { LoginDialog } from './login-dialog';

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
  /**
   * The "already have an account" style link in the top-right. `dialog` opens
   * the sign-in overlay instead of navigating, which is how the design has it.
   * Omitted by screens with no sensible alternate action — set-password,
   * reached mid-invite with a session already open, has nowhere else to send
   * someone.
   */
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

function StepMarker({ current }: { current: 1 | 2 }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="grid size-5 place-items-center rounded-full bg-forest text-[9.5px] font-bold text-gold">
        1
      </span>
      <span className="text-[10.5px] font-bold uppercase tracking-[.16em] text-forest">
        Account
      </span>
      <span aria-hidden className="mx-1 h-px w-[26px] bg-line-mint-2" />
      <span
        className={`grid size-5 place-items-center rounded-full border border-line-mint-2 text-[9.5px] font-bold ${
          current === 2 ? 'bg-forest text-gold' : 'bg-paper text-fa-muted-2'
        }`}
      >
        2
      </span>
      <span
        className={`text-[10.5px] font-bold uppercase tracking-[.16em] ${
          current === 2 ? 'text-forest' : 'text-fa-muted-2'
        }`}
      >
        Verify
      </span>
    </div>
  );
}

/** Sign-in has no step marker, but the panel is hidden on mobile — so the brand
 *  still has to appear somewhere on a small screen. */
function MobileBrand() {
  return (
    <Link href="/" className="flex items-center gap-2.5 text-forest lg:invisible">
      <span className="grid size-7 place-items-center rounded-lg bg-gold font-[family-name:var(--font-nr)] text-xs font-semibold text-forest">
        F&amp;A
      </span>
      <span className="font-[family-name:var(--font-nr)] text-base font-medium">Field &amp; Arena</span>
    </Link>
  );
}

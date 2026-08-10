'use client';

import { AuthField, AuthPasswordField } from '@/shared/ui/auth/auth-field';
import { AuthSubmit } from '@/shared/ui/auth/auth-primitives';

/**
 * Demo-only stand-in for the real `RiderAuthForm` — that component fires a
 * real `supabase.auth.signUp` on submit, which the SuperAdmin "Demo" button
 * must never do (legacy's own preview-rider-demo.html copy: "demo mode skips
 * real auth"). Same shared field primitives so it still looks like the real
 * step, but every input is inert (no form state, no validation, no mutation)
 * and "Continue" just advances the walkthrough.
 */
export function RiderDemoAccountStep({ onNext }: { onNext: () => void }) {
  return (
    <div className="[animation:fa-in_.22s_ease-out_both]">
      <h2 className="mb-2.5 font-[family-name:var(--font-nr)] text-[32px] font-medium leading-[1.06] tracking-[-.02em] text-forest">
        Create your account
      </h2>
      <p className="mb-[26px] text-[15px] leading-[1.58] text-fa-muted">
        One login to enter classes at any Field &amp; Arena show. Demo mode skips real auth — nothing
        typed here is sent anywhere.
      </p>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          onNext();
        }}
      >
        <AuthField label="Email address" type="email" readOnly value="amanda.clarke@example.com" />
        <div className="mt-[22px]">
          <AuthPasswordField label="Password" readOnly value="••••••••••" />
        </div>
        <div className="mt-7">
          <AuthSubmit>Continue</AuthSubmit>
        </div>
      </form>
    </div>
  );
}

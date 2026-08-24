'use client';

import { AuthField } from '@/shared/ui/auth/auth-field';
import { AuthPasswordField } from '@/shared/ui/auth/auth-password-field';
import { AuthSubmit } from '@/shared/ui/auth/auth-submit';

export function RiderDemoAccountStep({ onNext }: { onNext: () => void }) {
  return (
    <div className="[animation:fa-in_.22s_ease-out_both]">
      <h2 className="text-forest mb-2.5 font-[family-name:var(--font-nr)] text-[32px] leading-[1.06] font-medium tracking-[-.02em]">
        Create your account
      </h2>
      <p className="text-fa-muted mb-[26px] text-[15px] leading-[1.58]">
        One login to enter classes at any Field &amp; Arena show. Demo mode skips real auth —
        nothing typed here is sent anywhere.
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

'use client';

import { passwordStrength, passwordStrengthLabel } from '@/shared/lib/password-strength';

const STRENGTH_COLOURS = ['#C24A3A', '#D9A83C', '#3E8E5A'] as const;

export function PasswordStrengthMeter({ password }: { password: string }) {
  const score = passwordStrength(password);
  const filled = score > 0 ? STRENGTH_COLOURS[score - 1] : undefined;

  return (
    <div className="mt-3 flex items-center gap-3">
      <div className="flex flex-1 gap-[5px]" aria-hidden>
        {[1, 2, 3].map((segment) => (
          <span
            key={segment}
            className="h-[3px] flex-1 rounded-sm transition-colors"
            style={{ background: score >= segment && filled ? filled : '#E2E8E4' }}
          />
        ))}
      </div>
      <span
        aria-live="polite"
        className="text-fa-muted-2 min-w-[74px] text-right text-[11.5px] font-semibold tracking-[.04em]"
      >
        {passwordStrengthLabel(password)}
      </span>
    </div>
  );
}

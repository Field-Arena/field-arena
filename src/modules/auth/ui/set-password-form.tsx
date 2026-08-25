'use client';

import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AuthPasswordField } from '@/shared/ui/auth/auth-field';
import { AuthAlert, AuthSubmit, PasswordStrengthMeter } from '@/shared/ui/auth/auth-primitives';
import { setPasswordSchema, type SetPasswordInput } from '@/modules/auth/schemas';
import { useSetPassword } from '@/modules/auth/hooks/use-auth-mutations';

export function SetPasswordForm() {
  const [formError, setFormError] = useState<string | null>(null);

  const form = useForm<SetPasswordInput>({
    resolver: zodResolver(setPasswordSchema),
    defaultValues: { password: '', confirmPassword: '' },
    mode: 'onSubmit',
  });

  const setPassword = useSetPassword();

  const password = useWatch({ control: form.control, name: 'password' });
  const { errors } = form.formState;

  return (
    <div className="[animation:fa-in_.22s_ease-out_both]">
      <h1 className="text-forest mb-2.5 font-[family-name:var(--font-nr)] text-[40px] leading-[1.04] font-medium tracking-[-.022em]">
        Set your password
      </h1>
      <p className="text-fa-muted mb-[34px] text-[15.5px] leading-[1.58]">
        Choose a password for your account — you&apos;ll use it to sign back in from now on.
      </p>

      <form
        noValidate
        onSubmit={(event) => {
          void form.handleSubmit((values) => {
            setFormError(null);
            setPassword.mutate(values, {
              onSuccess: (outcome) => {
                if (outcome.status === 'error') setFormError(outcome.message);
              },
              onError: (error) => {
                setFormError(error.message);
              },
            });
          })(event);
        }}
      >
        <AuthPasswordField
          label="Password"
          autoComplete="new-password"
          placeholder="At least 8 characters"
          error={errors.password?.message}
          {...form.register('password')}
        />
        <PasswordStrengthMeter password={password} />

        <div className="mt-[22px]">
          <AuthPasswordField
            label="Confirm password"
            autoComplete="new-password"
            placeholder="Type it again"
            error={errors.confirmPassword?.message}
            {...form.register('confirmPassword')}
          />
        </div>

        {formError && (
          <div className="mt-5">
            <AuthAlert tone="error">{formError}</AuthAlert>
          </div>
        )}

        <div className="mt-7">
          <AuthSubmit pending={setPassword.isPending} pendingLabel="Setting password…">
            Continue
          </AuthSubmit>
        </div>
      </form>
    </div>
  );
}

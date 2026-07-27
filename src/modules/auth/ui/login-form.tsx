'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2Icon } from 'lucide-react';
import { Button } from '@/shared/ui/shadcn/button';
import { Input } from '@/shared/ui/shadcn/input';
import { Label } from '@/shared/ui/shadcn/label';
import { loginSchema, type LoginInput } from '../schemas';
import { useSignIn } from '../hooks/use-auth-mutations';

/**
 * The sign-in form, deliberately container-agnostic.
 *
 * The legacy build had no /login route at all — Clerk's hosted widget was
 * mounted into a div on the marketing page, so signing in was an overlay. Clerk
 * supplied that UI; Supabase Auth is an API, so the form is ours either way, and
 * the only real question is where it renders. This component is therefore used
 * twice: by the /login route (which middleware redirects to, and which invite and
 * password-reset links land on) and by the header dialog, which preserves the
 * overlay feel the app had before.
 */
export function LoginForm({ onSuccess }: { onSuccess?: () => void }) {
  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });
  const { mutate, isPending } = useSignIn({ onSuccess });

  const { errors } = form.formState;

  return (
    <form
      onSubmit={(event) => {
        // handleSubmit returns a promise; the DOM handler must return void.
        void form.handleSubmit((values) => {
          mutate(values);
        })(event);
      }}
      className="space-y-4"
      noValidate
    >
      <div className="space-y-1.5">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          placeholder="you@yourbarn.com"
          aria-invalid={!!errors.email}
          aria-describedby={errors.email ? 'email-error' : undefined}
          {...form.register('email')}
        />
        {errors.email && (
          <p id="email-error" role="alert" className="text-status-danger text-[13px]">
            {errors.email.message}
          </p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          autoComplete="current-password"
          aria-invalid={!!errors.password}
          aria-describedby={errors.password ? 'password-error' : undefined}
          {...form.register('password')}
        />
        {errors.password && (
          <p id="password-error" role="alert" className="text-status-danger text-[13px]">
            {errors.password.message}
          </p>
        )}
      </div>

      <Button type="submit" size="lg" disabled={isPending} className="w-full font-bold">
        {isPending && <Loader2Icon className="animate-spin" aria-hidden />}
        {isPending ? 'Signing in…' : 'Sign in'}
      </Button>

      <p className="text-fa-muted text-center text-[13px] leading-relaxed">
        Accounts are created by invitation. If you have not been invited yet, ask your organizer or a
        platform admin.
      </p>
    </form>
  );
}

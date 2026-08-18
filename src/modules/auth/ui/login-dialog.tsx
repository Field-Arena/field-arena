'use client';

import Link from 'next/link';
import { ArrowRightIcon, XIcon } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/shared/ui/shadcn/dialog';
import { Button } from '@/shared/ui/shadcn/button';
import { AuthAlert } from '@/shared/ui/auth/auth-primitives';
import { ROUTES } from '@/shared/constants/routes';
import { LoginForm } from '@/modules/auth/ui/login-form';
import { useLoginDialogStore } from '@/modules/auth/store';

/**
 * Sign-in as an overlay, which is how the design draws it — a dialog over the
 * page you were already on rather than a screen you navigate to.
 *
 * The /login ROUTE still exists too: the proxy redirects unauthenticated
 * requests somewhere, and password-reset and invite emails link to a URL, so
 * the same LoginForm renders in both places.
 */
export function LoginDialog() {
  const open = useLoginDialogStore((state) => state.open);
  const setOpen = useLoginDialogStore((state) => state.setOpen);
  const notice = useLoginDialogStore((state) => state.notice);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        showCloseButton={false}
        aria-label="Log in to Field & Arena"
        className="max-h-[90vh] gap-0 overflow-y-auto rounded-[18px] border-line bg-paper p-0 font-[family-name:var(--font-ar)] shadow-[0_40px_90px_rgba(9,26,21,.45)] sm:max-w-[452px]"
      >
        <Button
          type="button"
          variant="ghost"
          aria-label="Close"
          onClick={() => {
            setOpen(false);
          }}
          className="absolute right-5 top-5 h-auto grid size-[34px] place-items-center rounded-[9px] border border-line-mint bg-mint p-0 text-fa-muted transition-colors hover:border-forest hover:bg-forest hover:text-paper"
        >
          <XIcon className="size-[15px]" aria-hidden />
        </Button>

        {/* The heading moves with the panel — sign in, reset, code — so the
            dialog's accessible name is a fixed one that does not chase it. */}
        <DialogTitle className="sr-only">Log in to Field &amp; Arena</DialogTitle>
        <DialogDescription className="sr-only">
          Sign in to Field &amp; Arena, or reset your password.
        </DialogDescription>

        <div className="px-9 pb-[30px] pt-9">
          {notice && (
            <div className="mb-6">
              <AuthAlert tone="error">{notice}</AuthAlert>
            </div>
          )}

          <LoginForm
            showFooter={false}
            onSuccess={() => {
              setOpen(false);
            }}
          />
        </div>

        <div className="flex items-center justify-between gap-4 border-t border-line bg-mint px-9 py-5">
          <span className="text-[13.5px] text-fa-muted">New to Field &amp; Arena?</span>
          <Link
            href={ROUTES.signup}
            onClick={() => {
              setOpen(false);
            }}
            className="inline-flex items-center gap-2 text-[13.5px] font-bold text-forest transition-all duration-150 hover:gap-3 hover:text-gold"
          >
            Create an account
            <ArrowRightIcon className="size-3.5" aria-hidden />
          </Link>
        </div>
      </DialogContent>
    </Dialog>
  );
}

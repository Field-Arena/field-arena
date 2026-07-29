'use client';

import Link from 'next/link';
import { ArrowRightIcon, XIcon } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/shared/ui/shadcn/dialog';
import { ROUTES } from '@/shared/constants/routes';
import { LoginForm } from './login-form';
import { useLoginDialogStore } from '../store';

/**
 * Sign-in as an overlay, which is how the design draws it — a dialog over the
 * page you were already on rather than a screen you navigate to.
 *
 * The /login ROUTE still exists and is not redundant. The proxy redirects
 * unauthenticated requests somewhere, and password-reset and invite emails link
 * to a URL; a dialog has neither. So the same LoginForm renders in both, and the
 * route stays the destination for anything arriving from outside the app.
 */
export function LoginDialog() {
  const open = useLoginDialogStore((state) => state.open);
  const setOpen = useLoginDialogStore((state) => state.setOpen);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        showCloseButton={false}
        aria-label="Log in to Field & Arena"
        className="max-h-[90vh] gap-0 overflow-y-auto rounded-[18px] border-line bg-paper p-0 font-[family-name:var(--font-ar)] shadow-[0_40px_90px_rgba(9,26,21,.45)] sm:max-w-[452px]"
      >
        <button
          type="button"
          aria-label="Close"
          onClick={() => {
            setOpen(false);
          }}
          className="absolute right-5 top-5 grid size-[34px] place-items-center rounded-[9px] border border-line-mint bg-mint text-fa-muted transition-colors hover:border-forest hover:bg-forest hover:text-paper"
        >
          <XIcon className="size-[15px]" aria-hidden />
        </button>

        <div className="px-9 pb-[30px] pt-9">
          <div className="mb-[18px] flex items-center gap-3">
            <span aria-hidden className="h-[3px] w-[26px] bg-gold" />
            <span className="text-[10.5px] font-bold uppercase tracking-[.18em] text-forest">
              Log in
            </span>
          </div>

          <DialogTitle className="mb-2.5 font-[family-name:var(--font-nr)] text-[38px] font-medium leading-[1.02] tracking-[-.024em] text-forest">
            Welcome back.
          </DialogTitle>
          <DialogDescription className="mb-7 max-w-[330px] text-[15px] leading-[1.56] text-fa-muted">
            Organizer, staff, or rider — one login for Field &amp; Arena.
          </DialogDescription>

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

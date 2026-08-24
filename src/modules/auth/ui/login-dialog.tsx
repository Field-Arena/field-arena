'use client';

import Link from 'next/link';
import { ArrowRightIcon, XIcon } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/shared/ui/shadcn/dialog';
import { Button } from '@/shared/ui/shadcn/button';
import { AuthAlert } from '@/shared/ui/auth/auth-primitives';
import { ROUTES } from '@/shared/constants/routes';
import { LoginForm } from '@/modules/auth/ui/login-form';
import { useLoginDialogStore } from '@/modules/auth/store';

export function LoginDialog() {
  const open = useLoginDialogStore((state) => state.open);
  const setOpen = useLoginDialogStore((state) => state.setOpen);
  const notice = useLoginDialogStore((state) => state.notice);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        showCloseButton={false}
        aria-label="Log in to Field & Arena"
        className="border-line bg-paper max-h-[90vh] gap-0 overflow-y-auto rounded-[18px] p-0 font-[family-name:var(--font-ar)] shadow-[0_40px_90px_rgba(9,26,21,.45)] sm:max-w-[452px]"
      >
        <Button
          type="button"
          variant="ghost"
          aria-label="Close"
          onClick={() => {
            setOpen(false);
          }}
          className="border-line-mint bg-mint text-fa-muted hover:border-forest hover:bg-forest hover:text-paper absolute top-5 right-5 grid size-[34px] place-items-center rounded-[9px] border p-0 transition-colors"
        >
          <XIcon className="size-[15px]" aria-hidden />
        </Button>

        <DialogTitle className="sr-only">Log in to Field &amp; Arena</DialogTitle>
        <DialogDescription className="sr-only">
          Sign in to Field &amp; Arena, or reset your password.
        </DialogDescription>

        <div className="px-9 pt-9 pb-[30px]">
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

        <div className="border-line bg-mint flex items-center justify-between gap-4 border-t px-9 py-5">
          <span className="text-fa-muted text-[13.5px]">New to Field &amp; Arena?</span>
          <Link
            href={ROUTES.signup}
            onClick={() => {
              setOpen(false);
            }}
            className="text-forest hover:text-gold inline-flex items-center gap-2 text-[13.5px] font-bold transition-all duration-150 hover:gap-3"
          >
            Create an account
            <ArrowRightIcon className="size-3.5" aria-hidden />
          </Link>
        </div>
      </DialogContent>
    </Dialog>
  );
}

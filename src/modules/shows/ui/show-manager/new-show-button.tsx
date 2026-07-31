'use client';

import { Loader2Icon } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { useCreateDraftShow } from '../../hooks/use-show-mutations';

/**
 * "+ New Show" — the single entry point into the Show Manager flow.
 *
 * A button, not a link to a create form. The show is made on click and the
 * organizer lands on Setup, where Show Details is the first card: same fields,
 * one place, and the show already exists so nothing is lost if they wander off
 * halfway through naming it.
 */
export function NewShowButton({ className }: { className?: string }) {
  const { mutate, isPending } = useCreateDraftShow();

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() => {
        mutate();
      }}
      className={cn(
        'inline-flex items-center gap-[9px] rounded-[10px] bg-[#0D2C23] px-[18px] py-3',
        'text-[13.5px] font-bold text-white transition-colors hover:bg-[#16261F]',
        'disabled:opacity-70',
        className
      )}
    >
      {isPending && <Loader2Icon className="size-4 animate-spin" aria-hidden />}
      {isPending ? 'Creating…' : '+ New Show'}
    </button>
  );
}

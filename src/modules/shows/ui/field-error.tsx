import { cn } from '@/shared/lib/utils';

/** Inline validation message under a Show Manager / filing-cabinet input. */
export function FieldError({ message, className }: { message?: string; className?: string }) {
  if (!message) return null;
  return (
    <p role="alert" className={cn('mt-1.5 text-[12px] text-[#B42318]', className)}>
      {message}
    </p>
  );
}

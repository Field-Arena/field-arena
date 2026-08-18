import { cn } from '@/shared/lib/utils';

export function StatusPill({ status }: { status: string | null }) {
  const pending = status === 'pending';
  return (
    <span
      className={cn(
        'inline-flex h-[19px] items-center gap-1.5 justify-self-start rounded-full px-2 text-[10px] font-bold',
        pending ? 'bg-status-warn-bg text-status-warn' : 'bg-status-success-bg text-status-success'
      )}
    >
      <span className="size-[5px] rounded-full bg-current" aria-hidden />
      {pending ? 'Pending' : 'Active'}
    </span>
  );
}

import Link from 'next/link';
import { cn } from '@/shared/lib/utils';
import { FA_BTN, FA_BTN_PRIMARY } from '@/shared/ui/organizer/fa-page';

export function LaunchScoringButton({ active, classId }: { active: boolean; classId: string }) {
  if (!active) {
    return (
      <span className={cn(FA_BTN, 'flex-none cursor-not-allowed opacity-50')} aria-hidden>
        Launch scoring
      </span>
    );
  }

  return (
    <Link
      href={`/dashboard/scoring/${classId}`}
      prefetch={false}
      className={cn(FA_BTN_PRIMARY, 'flex-none')}
    >
      Launch scoring →
    </Link>
  );
}

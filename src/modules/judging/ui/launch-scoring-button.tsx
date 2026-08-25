import Link from 'next/link';

export function LaunchScoringButton({ active, classId }: { active: boolean; classId: string }) {
  if (!active) {
    return (
      <span
        className="flex-none rounded-[9px] bg-[#F1F4F3] px-5 py-[13px] text-[13.5px] font-bold whitespace-nowrap text-[#B4BFB9]"
        aria-hidden
      >
        Launch Scoring →
      </span>
    );
  }

  return (
    <Link
      href={`/dashboard/scoring/${classId}`}
      className="hover:bg-gold flex-none rounded-[9px] bg-[#1D4A38] px-5 py-[13px] text-[13.5px] font-bold whitespace-nowrap text-[#F5F7F6] transition-colors hover:text-[#0D2C23]"
    >
      Launch Scoring →
    </Link>
  );
}

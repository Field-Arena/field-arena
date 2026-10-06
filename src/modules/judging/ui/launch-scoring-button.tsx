import Link from 'next/link';

export function LaunchScoringButton({ active, classId }: { active: boolean; classId: string }) {
  if (!active) {
    return (
      <span
        className="fa-btn fa-btn-ghost cursor-not-allowed opacity-50"
        aria-disabled
        title="Scoring opens on the day of the class"
      >
        Launch scoring →
      </span>
    );
  }

  return (
    <Link href={`/dashboard/scoring/${classId}`} prefetch={false} className="fa-btn fa-btn-primary">
      Launch scoring →
    </Link>
  );
}

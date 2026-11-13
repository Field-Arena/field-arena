import type { DashboardReadiness, ShowStats } from '@/modules/shows/types';

const STAGE: Record<string, { label: string; badge: string }> = {
  setup: { label: 'Setup', badge: 'fa-stub' },
  'sales-open': { label: 'Ticket sales open', badge: 'fa-pass' },
  'sales-closed': { label: 'Sales closed', badge: 'fa-pending' },
  live: { label: 'Live', badge: 'fa-live' },
  complete: { label: 'Complete', badge: 'fa-onboard' },
};

function daysUntil(dateStr: string | null): number | null {
  if (!dateStr) return null;
  const target = new Date(dateStr);
  if (Number.isNaN(target.getTime())) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - today.getTime()) / 86_400_000);
}

export function DashboardReadinessCard({
  showName,
  startDate,
  stage,
  stats,
  readiness,
}: {
  showName: string;
  startDate: string | null;
  stage: string;
  stats: ShowStats;
  readiness: DashboardReadiness;
}) {
  const days = daysUntil(startDate);
  const stageInfo = STAGE[stage] ?? { label: stage, badge: 'fa-stub' };

  return (
    <div className="fa-aside-card">
      <h4>{showName} · readiness</h4>
      <div className="fa-kv">
        <span className="fa-k">Lifecycle</span>
        <span className="fa-v">
          <span className={`fa-badge ${stageInfo.badge}`} style={{ fontSize: 10 }}>
            <span className="fa-dot" />
            {stageInfo.label}
          </span>
        </span>
      </div>
      <div className="fa-kv">
        <span className="fa-k">Entries</span>
        <span className="fa-v">{stats.entries} sold</span>
      </div>
      <div className="fa-kv">
        <span className="fa-k">Schedule</span>
        <span
          className="fa-v"
          style={readiness.schedulePublished ? undefined : { color: 'var(--fa-amber)' }}
        >
          {readiness.schedulePublished ? 'Published' : 'Draft · unpublished'}
        </span>
      </div>
      <div className="fa-kv">
        <span className="fa-k">Days to show</span>
        <span className="fa-v">{days === null ? 'TBD' : days < 0 ? 'Past' : days}</span>
      </div>
      <div className="fa-kv">
        <span className="fa-k">Judges assigned</span>
        <span className="fa-v">
          {readiness.judgesAccepted} of {readiness.judgesTotal || readiness.judgesAccepted}
        </span>
      </div>
    </div>
  );
}

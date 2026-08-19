import { EmptyPanel } from '@/modules/staff/ui/workspace-page';
import { StatusBadge } from '@/shared/ui/status-badge';
import type { RingRow } from '@/modules/announcements/data/queries';

/** The "Active rings" section of the announcer's Up Next page — cards for every ring currently scoring. */
export function ActiveRingsPanel({ liveRings }: { liveRings: RingRow[] }) {
  return (
    <>
      <h2 className="show-detail-title" style={{ marginTop: 16 }}>
        Active rings
      </h2>
      {liveRings.length === 0 ? (
        <EmptyPanel
          title="Nothing live right now"
          note="A class appears here once its scoring is opened from the scoring screen."
        />
      ) : (
        <div className="cards" style={{ marginTop: 10 }}>
          {liveRings.map((ring) => (
            <div
              key={ring.classId}
              className="card-row today"
              style={{ flexDirection: 'column', alignItems: 'stretch', gap: 10 }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                <div className="card-main">
                  <div className="card-title">{ring.className}</div>
                  <div className="card-meta">
                    {ring.ring ?? 'Ring not set'} · ride {ring.position + 1} of {ring.entryCount}
                  </div>
                </div>
                {ring.current ? (
                  <div style={{ textAlign: 'right' }}>
                    <div className="now-eyebrow">Now in ring</div>
                    <div style={{ fontWeight: 700 }}>
                      #{ring.current.num} {ring.current.rider ?? '—'}
                    </div>
                    <div className="card-meta">{ring.current.horse ?? '—'}</div>
                  </div>
                ) : (
                  <StatusBadge tone="success">Ring complete</StatusBadge>
                )}
              </div>
              {ring.upNext.length > 0 && (
                <div style={{ borderTop: '1px solid #E9EDEB', paddingTop: 8 }}>
                  <div className="now-eyebrow">Up next</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 18px', marginTop: 4 }}>
                    {ring.upNext.map((entry) => (
                      <span key={entry.num} className="card-meta">
                        #{entry.num} {entry.rider ?? '—'}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </>
  );
}

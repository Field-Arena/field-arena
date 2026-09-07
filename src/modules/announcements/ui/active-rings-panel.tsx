import { EmptyPanel } from '@/modules/staff/ui/workspace-page';
import { StatusBadge } from '@/shared/ui/status-badge';
import type { RingRow } from '@/modules/announcements/data/queries';

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
                  <div className="now-eyebrow">Up next — rest of the running order</div>
                  {/* Legacy listed every remaining rider as its own queue row
                    * (announcer.html:478), not a truncated strip of chips. An
                    * announcer reads ahead to prep names, sponsors and horse
                    * details, so the whole order has to be visible. */}
                  <ol className="cards" style={{ marginTop: 6, paddingLeft: 0, listStyle: 'none' }}>
                    {ring.upNext.map((entry, i) => (
                      <li key={entry.num} className="queue-row">
                        <span className="q-num" aria-hidden="true">
                          {ring.position + 2 + i}
                        </span>
                        <div className="q-main">
                          <div className="q-name">
                            #{entry.num} · {entry.rider ?? '—'}
                          </div>
                          <div className="q-meta">{entry.horse ?? '—'}</div>
                        </div>
                      </li>
                    ))}
                  </ol>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </>
  );
}

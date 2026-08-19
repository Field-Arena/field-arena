'use client';
import { useMemo } from 'react';
import type { StablingData } from '@/modules/operations/data/queries';

export function StablingPanel({ stabling }: { stabling: StablingData }) {
  const byStable = useMemo(() => {
    const map = new Map<string, StablingData['stalls']>();
    for (const stall of stabling.stalls) {
      const list = map.get(stall.stable) ?? [];
      list.push(stall);
      map.set(stall.stable, list);
    }
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [stabling.stalls]);

  return (
    <div className="dash-card">
      <h2 style={{ fontSize: 17, color: 'var(--hunter-deep)', margin: '0 0 4px' }}>
        Stabling ({stabling.stalls.length} stalled)
      </h2>
      {!stabling.published ? (
        <p style={{ color: 'var(--fa-muted)' }}>
          Your organizer hasn&apos;t published the stable chart for this show yet.
        </p>
      ) : byStable.length === 0 ? (
        <p style={{ color: 'var(--fa-muted)' }}>No stalls assigned yet.</p>
      ) : (
        byStable.map(([stable, stalls]) => (
          <div key={stable} style={{ marginBottom: 16 }}>
            <h3
              style={{
                fontFamily: 'var(--serif)',
                fontSize: 15,
                color: 'var(--hunter-deep)',
                margin: '10px 0 6px',
              }}
            >
              {stable}{' '}
              <span style={{ fontWeight: 400, color: 'var(--fa-muted)' }}>
                ({stalls.length} stalls)
              </span>
            </h3>
            <div style={{ overflowX: 'auto' }}>
              <table>
                <thead>
                  <tr>
                    <th>Stall</th>
                    <th>#</th>
                    <th>Rider</th>
                    <th>Horse</th>
                  </tr>
                </thead>
                <tbody>
                  {stalls.map((s) => (
                    <tr key={`${s.stable}-${s.label}`}>
                      <td>{s.label}</td>
                      <td style={{ color: 'var(--fa-muted)' }}>{s.num ?? '—'}</td>
                      <td>{s.riderName}</td>
                      <td>{s.horseName}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

'use client';
import { useMemo, useState } from 'react';
import { Input } from '@/shared/ui/shadcn/input';
import type { RiderDirectoryRow } from '@/modules/operations/data/queries';
import { searchStyle } from '@/modules/operations/ui/directory-styles';

/** "Riders" — ported from showstaff-ops.html's viewRiders()/ridersRows(). */
export function RidersPanel({ riders }: { riders: RiderDirectoryRow[] }) {
  const [term, setTerm] = useState('');

  const rows = useMemo(() => {
    const q = term.trim().toLowerCase();
    if (!q) return riders;
    return riders.filter(
      (r) => r.name.toLowerCase().includes(q) || r.horse.toLowerCase().includes(q) || r.num.includes(q)
    );
  }, [term, riders]);

  return (
    <div className="dash-card">
      <h2 style={{ fontSize: 17, color: 'var(--hunter-deep)', margin: '0 0 4px' }}>
        Rider directory ({riders.length})
      </h2>
      <Input
        className="h-auto"
        style={searchStyle}
        placeholder="Search riders, horses, or numbers…"
        value={term}
        onChange={(e) => {
          setTerm(e.target.value);
        }}
      />
      {rows.length === 0 ? (
        <p style={{ color: 'var(--fa-muted)' }}>No matches.</p>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Rider</th>
                <th>Horse</th>
                <th>Stable</th>
                <th>Classes</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.num}>
                  <td>{r.num}</td>
                  <td>{r.name}</td>
                  <td>{r.horse}</td>
                  <td style={{ color: 'var(--fa-muted)' }}>{r.stable ?? '—'}</td>
                  <td style={{ color: 'var(--fa-muted)' }}>{r.classNames.join(', ')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

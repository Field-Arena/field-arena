'use client';
import { useMemo, useState } from 'react';
import { Input } from '@/shared/ui/shadcn/input';
import type { HorseDirectoryRow } from '@/modules/operations/data/queries';
import { searchStyle } from '@/modules/operations/ui/directory-styles';

export function HorsesPanel({ horses }: { horses: HorseDirectoryRow[] }) {
  const [term, setTerm] = useState('');

  const rows = useMemo(() => {
    const q = term.trim().toLowerCase();
    if (!q) return horses;
    return horses.filter(
      (h) => h.horseName.toLowerCase().includes(q) || h.riderName.toLowerCase().includes(q),
    );
  }, [term, horses]);

  return (
    <div className="dash-card">
      <h2 style={{ fontSize: 17, color: 'var(--hunter-deep)', margin: '0 0 4px' }}>
        Horse directory ({horses.length})
      </h2>
      <Input
        className="h-auto"
        style={searchStyle}
        placeholder="Search horses or riders…"
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
                <th>Horse</th>
                <th>Rider</th>
                <th>Trainer</th>
                <th>Stable</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((h) => (
                <tr key={h.key}>
                  <td>
                    <strong>{h.horseName}</strong>
                  </td>
                  <td>{h.riderName}</td>
                  <td style={{ color: 'var(--fa-muted)' }}>{h.trainer ?? '—'}</td>
                  <td style={{ color: 'var(--fa-muted)' }}>{h.stable ?? 'Day stall'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

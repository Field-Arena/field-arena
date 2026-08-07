'use client';
import { useMemo, useState } from 'react';
import type { HorseDirectoryRow, RiderDirectoryRow, VendorRow } from '../data/queries';
import { rowStyle, whereStyle, searchStyle } from './directory-styles';

/** "Find" — ported from showstaff-ops.html's viewFind()/findBody(): one search box across riders, horses, and vendors. */
export function FindPanel({
  riders,
  horses,
  vendors,
  canViewVendors,
}: {
  riders: RiderDirectoryRow[];
  horses: HorseDirectoryRow[];
  vendors: VendorRow[];
  canViewVendors: boolean;
}) {
  const [term, setTerm] = useState('');

  const matches = useMemo(() => {
    const q = term.trim().toLowerCase();
    if (!q) return null;
    return {
      riders: riders
        .filter((r) => r.name.toLowerCase().includes(q) || r.num.includes(q))
        .slice(0, 15),
      horses: horses.filter((h) => h.horseName.toLowerCase().includes(q)).slice(0, 15),
      vendors: canViewVendors
        ? vendors.filter((v) => v.name.toLowerCase().includes(q)).slice(0, 15)
        : [],
    };
  }, [term, riders, horses, vendors, canViewVendors]);

  const hasNoMatches =
    !!matches && matches.riders.length === 0 && matches.horses.length === 0 && matches.vendors.length === 0;

  return (
    <div className="dash-card">
      <input
        style={{ ...searchStyle, fontSize: 16, padding: '14px 16px' }}
        placeholder="Search riders, horses, or vendors…"
        value={term}
        onChange={(e) => {
          setTerm(e.target.value);
        }}
      />
      {!matches && <p style={{ color: 'var(--fa-muted)' }}>Start typing to search across the whole show.</p>}
      {hasNoMatches && <p style={{ color: 'var(--fa-muted)' }}>No matches for &quot;{term}&quot;.</p>}
      {matches && matches.riders.length > 0 && (
        <>
          <h3 style={{ fontSize: 14, color: 'var(--hunter-deep)', margin: '14px 0 4px' }}>Riders</h3>
          {matches.riders.map((r) => (
            <div key={r.num} style={rowStyle}>
              <div>
                <strong>
                  #{r.num} · {r.name}
                </strong>
                <br />
                <span style={{ color: 'var(--fa-muted)' }}>{r.horse}</span>
              </div>
              <div style={whereStyle}>
                {r.classNames.join(', ') || 'No classes'}
                {r.stable && (
                  <>
                    <br />
                    {r.stable}
                  </>
                )}
              </div>
            </div>
          ))}
        </>
      )}
      {matches && matches.horses.length > 0 && (
        <>
          <h3 style={{ fontSize: 14, color: 'var(--hunter-deep)', margin: '14px 0 4px' }}>Horses</h3>
          {matches.horses.map((h) => (
            <div key={h.key} style={rowStyle}>
              <div>
                <strong>{h.horseName}</strong>
                <br />
                <span style={{ color: 'var(--fa-muted)' }}>Ridden by {h.riderName}</span>
              </div>
              <div style={whereStyle}>
                {h.stable ?? 'Day stall'}
                <br />
                Trainer: {h.trainer ?? '—'}
              </div>
            </div>
          ))}
        </>
      )}
      {matches && matches.vendors.length > 0 && (
        <>
          <h3 style={{ fontSize: 14, color: 'var(--hunter-deep)', margin: '14px 0 4px' }}>Vendors</h3>
          {matches.vendors.map((v) => (
            <div key={v.id} style={rowStyle}>
              <div>
                <strong>{v.name}</strong>
                <br />
                <span style={{ color: 'var(--fa-muted)' }}>{v.productsOffered ?? '—'}</span>
              </div>
              <div style={whereStyle}>{v.contact ?? v.phone ?? '—'}</div>
            </div>
          ))}
        </>
      )}
    </div>
  );
}

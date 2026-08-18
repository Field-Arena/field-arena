'use client';
import type { VendorRow } from '@/modules/operations/data/queries';

/**
 * "Vendors" — ported from showstaff-ops.html's viewVendors(). `vendors` is
 * already an empty array by the time this renders unless the caller was
 * granted `canViewMoney` (see the page component) — matching legacy's
 * server-side 403 on the whole resource, not just a render-time hide.
 */
export function VendorsPanel({ vendors, canViewVendors }: { vendors: VendorRow[]; canViewVendors: boolean }) {
  return (
    <div className="dash-card">
      <h2 style={{ fontSize: 17, color: 'var(--hunter-deep)', margin: '0 0 4px' }}>
        Vendors ({canViewVendors ? vendors.length : 0})
      </h2>
      {!canViewVendors ? (
        <p style={{ color: 'var(--fa-muted)' }}>
          Ask your show organizer for financial-view access to see vendor details.
        </p>
      ) : vendors.length === 0 ? (
        <p style={{ color: 'var(--fa-muted)' }}>No vendors booked yet.</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
          {vendors.map((v) => (
            <div key={v.id} style={{ border: '1px solid var(--border)', borderRadius: 10, padding: '14px 16px' }}>
              <div style={{ fontWeight: 700, color: 'var(--hunter-deep)' }}>{v.name}</div>
              <div
                style={{
                  fontSize: 12,
                  color: 'var(--gold-dark)',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '.4px',
                  margin: '2px 0 6px',
                }}
              >
                {v.productsOffered ?? v.status}
              </div>
              <div style={{ fontSize: 12.5, color: 'var(--fa-muted)', lineHeight: 1.5 }}>
                {v.itemCount} space{v.itemCount === 1 ? '' : 's'} · {v.contact ?? v.contactName ?? v.phone ?? '—'}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

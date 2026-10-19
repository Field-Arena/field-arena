'use client';
import { useMemo, useState } from 'react';
import type { VendorRow } from '@/modules/operations/types';
import { OpsSearch } from '@/modules/operations/ui/ops-search';
import {
  Chip,
  ChipRow,
  EmptyState,
  FA_TABLE,
  FA_TABLE_WRAP,
  FA_TD,
  FA_TH,
  FA_THEAD_ROW,
  FA_TR,
  Pill,
  StatBox,
  StatGrid,
  type PillTone,
} from '@/shared/ui/organizer/fa-page';

const ALL = '__all__';

function statusTone(status: string): PillTone {
  if (status === 'approved' || status === 'paid') return 'green';
  if (status === 'pending') return 'yellow';
  if (status === 'rejected') return 'red';
  return 'grey';
}

function titleCase(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function VendorsPanel({
  vendors,
  canViewVendors,
}: {
  vendors: VendorRow[];
  canViewVendors: boolean;
}) {
  const [status, setStatus] = useState(ALL);
  const [term, setTerm] = useState('');

  const statuses = useMemo(() => {
    const map = new Map<string, number>();
    for (const v of vendors) map.set(v.status, (map.get(v.status) ?? 0) + 1);
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [vendors]);

  const spaces = useMemo(() => vendors.reduce((sum, v) => sum + v.itemCount, 0), [vendors]);

  const rows = useMemo(() => {
    const q = term.trim().toLowerCase();
    return vendors
      .filter((v) => status === ALL || v.status === status)
      .filter(
        (v) =>
          !q ||
          v.name.toLowerCase().includes(q) ||
          (v.productsOffered ?? '').toLowerCase().includes(q) ||
          (v.contact ?? v.contactName ?? '').toLowerCase().includes(q),
      );
  }, [vendors, status, term]);

  if (!canViewVendors) {
    return (
      <EmptyState
        title="No money access"
        note="Ask your show organizer for financial-view access to see vendor details."
      />
    );
  }

  return (
    <>
      <StatGrid cols={3}>
        <StatBox label="Vendors" value={vendors.length} note="booked" />
        <StatBox label="Spaces" value={spaces} note="booked across all vendors" />
        <StatBox
          label="Approved"
          note="approved or paid"
          value={vendors.filter((v) => statusTone(v.status) === 'green').length}
          tone="green"
        />
      </StatGrid>

      {vendors.length === 0 ? (
        <EmptyState title="No vendors booked yet" />
      ) : (
        <>
          <ChipRow>
            <Chip
              active={status === ALL}
              onClick={() => {
                setStatus(ALL);
              }}
            >
              All ({vendors.length})
            </Chip>
            {statuses.length > 1 &&
              statuses.map(([s, n]) => (
                <Chip
                  key={s}
                  active={status === s}
                  onClick={() => {
                    setStatus(s);
                  }}
                >
                  {titleCase(s)} ({n})
                </Chip>
              ))}
            <OpsSearch
              value={term}
              onChange={setTerm}
              placeholder="Vendor, product or contact"
              label="Search vendors"
            />
          </ChipRow>

          <div className={FA_TABLE_WRAP}>
            <table className={FA_TABLE}>
              <thead>
                <tr className={FA_THEAD_ROW}>
                  <th className={FA_TH}>Vendor</th>
                  <th className={FA_TH}>Products</th>
                  <th className={FA_TH}>Spaces</th>
                  <th className={FA_TH}>Contact</th>
                  <th className={FA_TH}>Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 && (
                  <tr className={FA_TR}>
                    <td colSpan={5} className={`${FA_TD} text-[#5A6B63]`}>
                      No matches.
                    </td>
                  </tr>
                )}
                {rows.map((v) => (
                  <tr key={v.id} className={FA_TR}>
                    <td className={`${FA_TD} font-bold`}>{v.name}</td>
                    <td className={`${FA_TD} text-[#5A6B63]`}>{v.productsOffered ?? '—'}</td>
                    <td className={FA_TD}>{v.itemCount}</td>
                    <td className={`${FA_TD} font-semibold text-[#5A6B63]`}>
                      {v.contact ?? v.contactName ?? v.phone ?? '—'}
                    </td>
                    <td className={FA_TD}>
                      <Pill tone={statusTone(v.status)}>{titleCase(v.status)}</Pill>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </>
  );
}

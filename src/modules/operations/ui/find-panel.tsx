'use client';
import { useMemo, useState } from 'react';
import type { HorseDirectoryRow, RiderDirectoryRow, VendorRow } from '@/modules/operations/types';
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
  SectionLabel,
  StatBox,
  StatGrid,
} from '@/shared/ui/organizer/fa-page';

type Scope = 'all' | 'riders' | 'horses' | 'vendors';

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
  const [scope, setScope] = useState<Scope>('all');

  const matches = useMemo(() => {
    const q = term.trim().toLowerCase();
    if (!q) return null;
    const num = q.replace(/^#/, '');
    return {
      riders: riders
        .filter((r) => r.name.toLowerCase().includes(q) || r.num.includes(num))
        .slice(0, 15),
      horses: horses.filter((h) => h.horseName.toLowerCase().includes(q)).slice(0, 15),
      vendors: canViewVendors
        ? vendors.filter((v) => v.name.toLowerCase().includes(q)).slice(0, 15)
        : [],
    };
  }, [term, riders, horses, vendors, canViewVendors]);

  const show = (s: Exclude<Scope, 'all'>) => scope === 'all' || scope === s;
  const visibleCount = matches
    ? (show('riders') ? matches.riders.length : 0) +
      (show('horses') ? matches.horses.length : 0) +
      (show('vendors') ? matches.vendors.length : 0)
    : 0;

  const scopes: [Scope, string][] = [
    ['all', 'Everything'],
    ['riders', 'Riders'],
    ['horses', 'Horses'],
    ...(canViewVendors ? [['vendors', 'Vendors'] as [Scope, string]] : []),
  ];

  return (
    <>
      <StatGrid cols={3}>
        <StatBox label="Riders" value={riders.length} note="entered" />
        <StatBox label="Horses" value={horses.length} note="entered" />
        <StatBox
          label="Vendors"
          value={canViewVendors ? vendors.length : '—'}
          note={canViewVendors ? 'booked' : 'No money access'}
        />
      </StatGrid>

      <ChipRow>
        {scopes.map(([key, label]) => (
          <Chip
            key={key}
            active={scope === key}
            onClick={() => {
              setScope(key);
            }}
          >
            {label}
          </Chip>
        ))}
        <OpsSearch
          value={term}
          onChange={setTerm}
          placeholder="Search riders, horses, or vendors…"
          label="Search the whole show"
          className="w-[340px]"
        />
      </ChipRow>

      {!matches && (
        <EmptyState
          title="Start typing to search"
          note="Searches riders, horses and vendors across the whole show."
        />
      )}
      {matches && visibleCount === 0 && (
        <EmptyState
          title="No matches"
          note={<span className="[overflow-wrap:anywhere]">Nothing found for “{term}”.</span>}
        />
      )}

      {matches && show('riders') && matches.riders.length > 0 && (
        <>
          <SectionLabel>Riders</SectionLabel>
          <div className={FA_TABLE_WRAP}>
            <table className={FA_TABLE}>
              <thead>
                <tr className={FA_THEAD_ROW}>
                  <th className={FA_TH}>Rider</th>
                  <th className={FA_TH}>Horse</th>
                  <th className={FA_TH}>Classes</th>
                  <th className={FA_TH}>Stable · Stall</th>
                </tr>
              </thead>
              <tbody>
                {matches.riders.map((r) => (
                  <tr key={r.num} className={FA_TR}>
                    <td className={`${FA_TD} font-bold`}>
                      #{r.num} · {r.name}
                    </td>
                    <td className={FA_TD}>{r.horse}</td>
                    <td className={`${FA_TD} text-[12.5px] text-[#5A6B63]`}>
                      {r.classNames.join(', ') || 'No classes'}
                    </td>
                    <td className={`${FA_TD} font-semibold text-[#5A6B63]`}>{r.stable ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {matches && show('horses') && matches.horses.length > 0 && (
        <>
          <SectionLabel>Horses</SectionLabel>
          <div className={FA_TABLE_WRAP}>
            <table className={FA_TABLE}>
              <thead>
                <tr className={FA_THEAD_ROW}>
                  <th className={FA_TH}>Horse</th>
                  <th className={FA_TH}>Rider</th>
                  <th className={FA_TH}>Trainer</th>
                  <th className={FA_TH}>Stable · Stall</th>
                </tr>
              </thead>
              <tbody>
                {matches.horses.map((h) => (
                  <tr key={h.key} className={FA_TR}>
                    <td className={`${FA_TD} font-bold`}>{h.horseName}</td>
                    <td className={FA_TD}>{h.riderName}</td>
                    <td className={`${FA_TD} font-semibold text-[#5A6B63]`}>{h.trainer ?? '—'}</td>
                    <td className={`${FA_TD} font-semibold text-[#5A6B63]`}>
                      {h.stable ?? 'Day stall'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {matches && show('vendors') && matches.vendors.length > 0 && (
        <>
          <SectionLabel>Vendors</SectionLabel>
          <div className={FA_TABLE_WRAP}>
            <table className={FA_TABLE}>
              <thead>
                <tr className={FA_THEAD_ROW}>
                  <th className={FA_TH}>Vendor</th>
                  <th className={FA_TH}>Products</th>
                  <th className={FA_TH}>Contact</th>
                </tr>
              </thead>
              <tbody>
                {matches.vendors.map((v) => (
                  <tr key={v.id} className={FA_TR}>
                    <td className={`${FA_TD} font-bold`}>{v.name}</td>
                    <td className={`${FA_TD} text-[#5A6B63]`}>{v.productsOffered ?? '—'}</td>
                    <td className={`${FA_TD} font-semibold text-[#5A6B63]`}>
                      {v.contact ?? v.phone ?? '—'}
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

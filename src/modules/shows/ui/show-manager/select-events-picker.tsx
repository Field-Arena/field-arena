'use client';

import { useState } from 'react';
import Link from 'next/link';
import { CATALOG_CATEGORIES } from '@/modules/shows/constants';
import type { SelectEventsData } from '@/modules/shows/types';
import { groupOfferedClasses } from '@/modules/shows/offered-classes';
import { formatMoney } from '@/shared/lib/format/currency';
import { EventSourceButtons } from '@/modules/shows/ui/show-manager/event-source-buttons';
import { CategoryBlock } from '@/modules/shows/ui/show-manager/category-block';
import { OfferedTestRow } from '@/modules/shows/ui/show-manager/offered-test-row';

const SECTION_TINTS = ['#0B6BB8', '#146A47', '#C0367A', '#B45309', '#5B5BD6'] as const;

export function SelectEventsPicker({ data }: { data: SelectEventsData }) {
  const [catalogOpen, setCatalogOpen] = useState(false);
  const chosen = new Set(data.classes.map((c) => c.groupName).filter((g): g is string => !!g));
  const sections = groupOfferedClasses(data, CATALOG_CATEGORIES);
  const tests = sections.flatMap((s) => s.tests);
  const fees = data.classes.map((c) => c.fee);
  const minFee = fees.length > 0 ? Math.min(...fees) : 0;
  const maxFee = fees.length > 0 ? Math.max(...fees) : 0;
  const entries = data.classes.reduce((sum, c) => sum + c.entryCount, 0);
  const qualifying = tests.filter((t) => t.qualifying).length;

  const stats = [
    {
      num: String(tests.length),
      lab: 'Classes offered',
      sub: `${String(data.classes.length)} class ${data.classes.length === 1 ? 'row' : 'rows'} across divisions`,
    },
    {
      num:
        fees.length === 0
          ? '—'
          : minFee === maxFee
            ? formatMoney(minFee)
            : `${formatMoney(minFee)}–${formatMoney(maxFee)}`,
      lab: 'Fee range',
      sub: 'price per event',
    },
    { num: String(qualifying), lab: 'Qualifying', sub: 'championship rides' },
    { num: String(entries), lab: 'Entries so far', sub: 'across offered classes' },
  ];

  return (
    <>
      <div className="fa-autosave-bar !mb-0">
        <span className="fa-as-dot" />
        These are the classes riders can enter. Add tests from the catalog, then set divisions,
        price, and qualifying per test — saves instantly.
      </div>

      <div className="fa-stats !mb-0">
        {stats.map((s) => (
          <div key={s.lab} className="fa-stat">
            <div className="fa-num">{s.num}</div>
            <div className="fa-lab">{s.lab}</div>
            <div className="fa-sub">{s.sub}</div>
          </div>
        ))}
      </div>

      <div className="fa-card">
        <div className="fa-card-head">
          <div>
            <h3>Offered classes</h3>
            <div className="fa-sub">
              {tests.length} {tests.length === 1 ? 'class' : 'classes'}
            </div>
          </div>
          <button
            type="button"
            className="fa-btn fa-btn-primary"
            onClick={() => {
              setCatalogOpen(true);
            }}
          >
            <svg
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              viewBox="0 0 24 24"
              aria-hidden
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14" />
            </svg>
            Add tests
          </button>
        </div>

        <div className="fa-pick-toolbar">
          <EventSourceButtons data={data} />
        </div>

        {data.divisions.length === 0 && tests.length > 0 && (
          <div className="border-b border-[var(--fa-line-soft)] bg-[var(--fa-amber-tint)] px-5 py-2.5 text-[12.5px] text-[var(--fa-amber)]">
            This show has no divisions yet —{' '}
            <Link href="./#class-divisions" className="font-semibold underline">
              add them under Setup
            </Link>{' '}
            to offer each test per division.
          </div>
        )}

        {tests.length === 0 ? (
          <div className="fa-oc-empty">
            <svg
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              viewBox="0 0 24 24"
              aria-hidden
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 5h10v14H4zM14 8h6v11h-6" />
            </svg>
            <p>No classes yet. Add tests from the catalog to open them for entries.</p>
            <button
              type="button"
              className="fa-btn fa-btn-primary"
              onClick={() => {
                setCatalogOpen(true);
              }}
            >
              Add tests
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="fa-table fa-offered-table min-w-[860px]">
              <thead>
                <tr>
                  <th>Class</th>
                  <th>Divisions</th>
                  <th>Price</th>
                  <th className="!text-center">Qual.</th>
                  <th className="fa-num">Entries</th>
                  <th aria-label="Remove" />
                </tr>
              </thead>
              <tbody>
                {sections.map((section, i) => (
                  <SectionRows
                    key={section.category}
                    category={section.category}
                    tint={SECTION_TINTS[i % SECTION_TINTS.length] ?? SECTION_TINTS[0]}
                  >
                    {section.tests.map((test) => (
                      <OfferedTestRow
                        key={test.key}
                        showId={data.showId}
                        test={test}
                        divisions={data.divisions.map((d) => d.name)}
                      />
                    ))}
                  </SectionRows>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {catalogOpen && (
        <div
          className="fa-modal-overlay fa-open"
          role="dialog"
          aria-modal="true"
          aria-label="Add tests from the catalog"
          onClick={(e) => {
            if (e.target === e.currentTarget) setCatalogOpen(false);
          }}
        >
          <div className="fa-modal !max-w-[860px]">
            <div className="fa-modal-head">
              <div>
                <h3>Add tests from the catalog</h3>
                <div className="fa-mh-sub">
                  Tick a level to offer all its tests; pick its division and ring as you go.
                </div>
              </div>
              <button
                type="button"
                className="fa-modal-x"
                aria-label="Close"
                onClick={() => {
                  setCatalogOpen(false);
                }}
              >
                <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
            </div>
            <div className="fa-modal-body flex flex-col gap-6 p-5">
              {CATALOG_CATEGORIES.map((category) => (
                <CategoryBlock key={category} category={category} data={data} chosen={chosen} />
              ))}
            </div>
            <div className="fa-modal-foot">
              <span className="fa-autosave-inline">
                <span className="fa-as-dot" />
                Changes save as you tick
              </span>
              <button
                type="button"
                className="fa-btn fa-btn-primary"
                onClick={() => {
                  setCatalogOpen(false);
                }}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function SectionRows({
  category,
  tint,
  children,
}: {
  category: string;
  tint: string;
  children: React.ReactNode;
}) {
  return (
    <>
      <tr className="!bg-[var(--fa-surface-2)]">
        <td colSpan={6} className="!py-2">
          <span
            className="rounded-[5px] px-[7px] py-0.5 text-[10px] font-extrabold tracking-[.04em] text-white uppercase"
            style={{ background: tint }}
          >
            {category}
          </span>
        </td>
      </tr>
      {children}
    </>
  );
}

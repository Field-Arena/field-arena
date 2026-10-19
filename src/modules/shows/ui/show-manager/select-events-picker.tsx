'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import type { SelectEventsData } from '@/modules/shows/types';
import { useSelectEventsBoard } from '@/modules/shows/hooks/use-select-events-board';
import { EventSourceButtons } from '@/modules/shows/ui/show-manager/event-source-buttons';
import { OfferedTestRow } from '@/modules/shows/ui/show-manager/offered-test-row';
import { BodyPill } from '@/modules/shows/ui/show-manager/level-pill';
import { CatalogPickerDialog } from '@/modules/shows/ui/show-manager/catalog-picker-dialog';

const PLUS_ICON = (
  <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14" />
  </svg>
);

export function SelectEventsPicker({
  data,
  footer,
}: {
  data: SelectEventsData;
  footer?: ReactNode;
}) {
  const board = useSelectEventsBoard(data);
  const { sections, stats, picker } = board;

  return (
    <>
      <div className="fa-autosave-bar !mb-0">
        <span className="fa-as-dot" />
        <span>
          These are the classes riders can enter. Add tests from the FEI / USEF / USDF catalog, then
          set divisions, price, and qualifying per class — saves instantly.
        </span>
      </div>

      <div className="fa-stats !mb-0">
        {stats.cards.map((s) => (
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
              {stats.testCount} {stats.testCount === 1 ? 'class' : 'classes'}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="fa-quick-add">
              <span className="fa-qa-lab">Add all:</span>
              {board.catalogBodies.map((body) => (
                <button
                  key={body}
                  type="button"
                  className="fa-qa-btn"
                  style={{ background: board.bodyColor(body) }}
                  disabled={board.busy}
                  onClick={() => {
                    board.addAllBody(body);
                  }}
                >
                  {body}
                </button>
              ))}
            </div>
            <button
              type="button"
              className="fa-btn fa-btn-primary fa-btn-sm"
              onClick={picker.openPicker}
            >
              {PLUS_ICON}
              Add tests
            </button>
          </div>
        </div>

        <EventSourceButtons data={data} />

        {data.divisions.length === 0 && stats.testCount > 0 && (
          <div className="border-b border-[var(--fa-line-soft)] bg-[var(--fa-amber-tint)] px-5 py-2.5 text-[12.5px] text-[var(--fa-amber)]">
            This show has no divisions yet —{' '}
            <Link href="./#class-divisions" className="font-semibold underline">
              add them under Setup
            </Link>{' '}
            to offer each test per division.
          </div>
        )}

        {stats.testCount === 0 ? (
          <div className="fa-oc-empty">
            <svg
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              viewBox="0 0 24 24"
              className="mx-auto"
              aria-hidden
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 3v18M4 5h10v14H4zM14 8h6v11h-6"
              />
            </svg>
            <p>No classes yet. Add tests from the FEI, USEF, or USDF catalog to get started.</p>
            <button type="button" className="fa-btn fa-btn-primary" onClick={picker.openPicker}>
              + Add tests
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
                {sections.map((section) => (
                  <SectionRows key={section.body} label={section.body} color={section.color}>
                    {section.tests.map((test) => (
                      <OfferedTestRow
                        key={test.key}
                        showId={data.showId}
                        test={test}
                        divisions={board.divisions.map((d) => d.name)}
                      />
                    ))}
                  </SectionRows>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {footer}
      </div>

      {picker.open && <CatalogPickerDialog picker={picker} />}
    </>
  );
}

function SectionRows({
  label,
  color,
  children,
}: {
  label: string;
  color: string;
  children: ReactNode;
}) {
  return (
    <>
      <tr>
        <td colSpan={6} className="!bg-[var(--fa-surface-2)] !px-5 !py-2">
          <BodyPill label={label} color={color} />
        </td>
      </tr>
      {children}
    </>
  );
}

'use client';

import { useState } from 'react';
import { divisionShort, type OfferedTest } from '@/modules/shows/offered-classes';
import { levelStyle } from '@/modules/shows/test-catalog';
import {
  useRemoveTestClasses,
  useSetTestDivision,
  useSetTestQualifying,
  useUpdateTestFee,
} from '@/modules/shows/hooks/use-select-events-mutations';
import { sanitizeDecimalInput } from '@/shared/lib/format/number-input';
import { LevelPill } from '@/modules/shows/ui/show-manager/level-pill';

export function OfferedTestRow({
  showId,
  test,
  divisions,
}: {
  showId: string;
  test: OfferedTest;
  divisions: string[];
}) {
  const classIds = test.classes.map((c) => c.id);
  const [fee, setFee] = useState(String(test.fee));
  const [prevFee, setPrevFee] = useState(test.fee);
  if (test.fee !== prevFee) {
    setPrevFee(test.fee);
    setFee(String(test.fee));
  }

  const setDivision = useSetTestDivision();
  const updateFee = useUpdateTestFee();
  const setQualifying = useSetTestQualifying();
  const remove = useRemoveTestClasses();
  const level = levelStyle(test.level);

  function commitFee() {
    const next = Number(fee);
    if (fee.trim() === '' || !Number.isFinite(next) || next < 0 || next > 100000) {
      setFee(String(test.fee));
      return;
    }
    if (next === test.fee && !test.feeMixed) return;
    updateFee.mutate({ showId, classIds, fee: next });
  }

  return (
    <tr className={remove.isPending ? 'opacity-50' : undefined}>
      <td>
        <div className="fa-oc-name">
          <b>{test.test}</b>
          <div className="fa-oc-sub">
            {test.level !== 'other' && <LevelPill name={level.name} color={level.color} />}
            <span className="fa-tag-usef">{test.code}</span>
          </div>
        </div>
      </td>
      <td>
        {divisions.length === 0 ? (
          <span className="text-[12px] text-[var(--fa-ink-3)]">No divisions</span>
        ) : (
          <div className="fa-divsel">
            {divisions.map((d) => {
              const on = test.divisionsOn.includes(d);
              return (
                <button
                  key={d}
                  type="button"
                  title={d}
                  aria-pressed={on}
                  disabled={setDivision.isPending}
                  className={`fa-divmini ${on ? 'fa-on' : ''}`}
                  onClick={() => {
                    setDivision.mutate({ showId, classIds, division: d, on: !on });
                  }}
                >
                  {divisionShort(d)}
                </button>
              );
            })}
          </div>
        )}
      </td>
      <td>
        <span className="fa-prefix-input fa-pi-sm inline-flex items-center">
          <span>$</span>
          <input
            type="text"
            inputMode="decimal"
            value={fee}
            aria-label={`Price for ${test.test}`}
            className="rounded-[6px] border border-[var(--fa-line)] bg-[var(--fa-surface)] text-[var(--fa-ink)] outline-none focus:border-[#9fd3ba]"
            onChange={(e) => {
              setFee(sanitizeDecimalInput(e.target.value, { maxIntegerDigits: 6 }));
            }}
            onBlur={commitFee}
            onKeyDown={(e) => {
              if (e.key === 'Enter') e.currentTarget.blur();
            }}
          />
        </span>
        {test.feeMixed && (
          <div className="mt-0.5 text-[10.5px] text-[var(--fa-amber)]">varies by division</div>
        )}
      </td>
      <td className="text-center">
        <span className="fa-qbox">
          <button
            type="button"
            className={`fa-qual-ic ${test.qualifying ? 'fa-on' : ''}`}
            title={
              test.qualifying ? 'Qualifying ride — click to remove' : 'Mark as qualifying ride'
            }
            aria-pressed={test.qualifying}
            disabled={setQualifying.isPending}
            onClick={() => {
              setQualifying.mutate({ showId, classIds, qualifying: !test.qualifying });
            }}
          >
            <svg
              viewBox="0 0 24 24"
              fill={test.qualifying ? 'currentColor' : 'none'}
              stroke="currentColor"
              strokeWidth="1.5"
              aria-hidden
            >
              <path
                strokeLinejoin="round"
                d="M12 2.6l2.9 5.88 6.49.94-4.7 4.58 1.11 6.46L12 17.98l-5.8 3.06 1.1-6.46-4.69-4.58 6.49-.94z"
              />
            </svg>
          </button>
        </span>
      </td>
      <td className="fa-num">{test.entries > 0 ? test.entries : '—'}</td>
      <td className="text-right">
        <button
          type="button"
          className="fa-row-x"
          title={test.entries > 0 ? 'Riders have entered — cannot remove' : 'Remove class'}
          aria-label={`Remove ${test.test}`}
          disabled={remove.isPending || test.entries > 0}
          onClick={() => {
            remove.mutate({ showId, classIds, name: test.test });
          }}
        >
          <svg fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
      </td>
    </tr>
  );
}

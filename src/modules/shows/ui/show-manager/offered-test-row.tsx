'use client';

import { useState } from 'react';
import type { OfferedTest } from '@/modules/shows/offered-classes';
import {
  useRemoveTestClasses,
  useSetTestDivision,
  useSetTestQualifying,
  useUpdateTestFee,
} from '@/modules/shows/hooks/use-select-events-mutations';
import { sanitizeDecimalInput } from '@/shared/lib/format/number-input';

/** Short labels for the division toggles ("Adult Amateur" → "AA"). */
function divisionShort(name: string): string {
  const words = name.split(/\s+/).filter(Boolean);
  if (words.length === 1) return name.length <= 5 ? name : name.slice(0, 4);
  return words
    .filter((w) => !/^rider$/i.test(w) || words.length === 1)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('')
    .replace(/^J$/, 'Jr');
}

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
        </div>
        <div className="fa-oc-sub">
          {test.group && (
            <span className="text-[11.5px] font-semibold text-[var(--fa-sky)]">{test.group}</span>
          )}
          <span className="fa-tag-usef">{test.code}</span>
        </div>
      </td>
      <td>
        {divisions.length === 0 ? (
          <span className="text-[12px] text-[var(--fa-ink-3)]">No divisions</span>
        ) : (
          <div className="fa-divsel inline-flex">
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
        <div className="fa-field !gap-1">
          <div className="fa-prefix-input fa-pi-sm w-fit">
            <span>$</span>
            <input
              type="text"
              inputMode="decimal"
              value={fee}
              aria-label={`Price for ${test.test}`}
              onChange={(e) => {
                setFee(sanitizeDecimalInput(e.target.value, { maxIntegerDigits: 6 }));
              }}
              onBlur={commitFee}
              onKeyDown={(e) => {
                if (e.key === 'Enter') e.currentTarget.blur();
              }}
            />
          </div>
          {test.feeMixed && (
            <span className="text-[10.5px] text-[var(--fa-amber)]">varies by division</span>
          )}
        </div>
      </td>
      <td className="text-center">
        <button
          type="button"
          className={`fa-qual-ic mx-auto ${test.qualifying ? 'fa-on' : ''}`}
          title={test.qualifying ? 'Qualifying — click to unmark' : 'Mark as qualifying'}
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
            strokeWidth="1.7"
            aria-hidden
          >
            <path
              strokeLinejoin="round"
              d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9L12 3z"
            />
          </svg>
        </button>
      </td>
      <td className="fa-num">{test.entries > 0 ? test.entries : '—'}</td>
      <td className="text-right">
        <button
          type="button"
          className="fa-row-x"
          title={test.entries > 0 ? 'Riders have entered — cannot remove' : `Remove ${test.test}`}
          aria-label={`Remove ${test.test}`}
          disabled={remove.isPending || test.entries > 0}
          onClick={() => {
            remove.mutate({ showId, classIds, name: test.test });
          }}
        >
          <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden>
            <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
      </td>
    </tr>
  );
}

'use client';

import { useState } from 'react';
import type { UpdateShowDetailsInput } from '../../schemas';
import type { ShowSetupDetail } from '../../data/setup-queries';
import { useUpdateShowDetails } from '../../hooks/use-show-mutations';
import { Card } from '@/shared/ui/organizer/card';
import { GhostButton } from '@/shared/ui/organizer/buttons';
import { SM_CARD_PAD, SM_SECTION_HEAD, SM_LABEL, SM_INPUT, SM_SELECT } from './tokens';

/**
 * The exact 3-body list showstaff.html's renderSetupView hardcodes for this
 * card — distinct from schemas.ts's broader GOVERNING_BODIES (which also
 * offers USEA/None), that being the create-show form's own picker.
 */
const SHOW_DETAILS_BODIES = ['FEI', 'USDF', 'USEF'] as const;

/**
 * "Show Details" — the first Setup card. Every field autosaves on blur/change
 * (see updateShowDetails in data/mutations.ts for why there is no Save
 * button); this component's local state is what's on screen, and a field
 * commit sends the *whole* card, matching showstaff.html's saveSmShowDetails.
 *
 * Org/club name is the one field with an explicit edit/view toggle in the
 * design — org.readonly by default, org.editing behind an "Edit" button —
 * because it is a free-text override of the account's org name, edited far
 * less often than the rest of the card.
 */
export function ShowDetailsCard({ show }: { show: ShowSetupDetail }) {
  const [name, setName] = useState(show.name);
  const [org, setOrg] = useState(show.org ?? '');
  const [orgEditing, setOrgEditing] = useState(false);
  const [showType, setShowType] = useState(show.showType);
  const [startDate, setStartDate] = useState(show.startDate ?? '');
  const [endDate, setEndDate] = useState(show.endDate ?? '');
  const [timezone, setTimezone] = useState(show.timezone ?? '');
  const [startingRiderNumber, setStartingRiderNumber] = useState(show.startingRiderNumber);
  const [governingBodies, setGoverningBodies] = useState<string[]>(show.governingBodies);

  const { mutate } = useUpdateShowDetails();

  function save(overrides: Partial<UpdateShowDetailsInput> = {}) {
    mutate({
      showId: show.id,
      name,
      org,
      showType,
      startDate,
      endDate,
      timezone,
      startingRiderNumber,
      governingBodies: governingBodies as UpdateShowDetailsInput['governingBodies'],
      ...overrides,
    });
  }

  function toggleBody(body: (typeof SHOW_DETAILS_BODIES)[number]) {
    const next = governingBodies.includes(body)
      ? governingBodies.filter((b) => b !== body)
      : [...governingBodies, body];
    setGoverningBodies(next);
    save({ governingBodies: next as UpdateShowDetailsInput['governingBodies'] });
  }

  return (
    <Card className={SM_CARD_PAD}>
      <h2 className={SM_SECTION_HEAD}>Show Details</h2>

      <div className="mb-[22px]">
        <label htmlFor="sm-name" className={SM_LABEL}>
          Show name <span className="text-status-danger">*</span>
        </label>
        <input
          id="sm-name"
          value={name}
          placeholder="Name this show"
          className={SM_INPUT}
          onChange={(e) => {
            setName(e.target.value);
          }}
          onBlur={() => {
            save();
          }}
        />
      </div>

      <div className="grid grid-cols-1 gap-x-[26px] gap-y-[22px] sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <div className="mb-2 flex items-center gap-3">
            <span className={`${SM_LABEL} mb-0 flex-1`}>Organization / club name</span>
            <GhostButton
              className="px-3.5 py-2.5 text-[12.5px]"
              onClick={() => {
                if (orgEditing) save();
                setOrgEditing((v) => !v);
              }}
            >
              {orgEditing ? 'Done' : 'Edit'}
            </GhostButton>
          </div>
          {orgEditing ? (
            <input
              autoFocus
              value={org}
              className={SM_INPUT}
              onChange={(e) => {
                setOrg(e.target.value);
              }}
              onBlur={() => {
                save();
              }}
            />
          ) : (
            <div className="border-b border-[#EDF0EE] pb-[13px] text-[14.5px] text-ink-deep">
              {org || <span className="text-[#98A29D] italic">Not set</span>}
            </div>
          )}
        </div>

        <div>
          <label htmlFor="sm-showtype" className={SM_LABEL}>
            Show type
          </label>
          <select
            id="sm-showtype"
            value={showType}
            className={SM_SELECT}
            onChange={(e) => {
              const next = e.target.value as 'rated' | 'schooling';
              setShowType(next);
              save({ showType: next });
            }}
          >
            <option value="rated">Rated Show</option>
            <option value="schooling">Schooling Show</option>
          </select>
        </div>

        <div>
          <label htmlFor="sm-start" className={SM_LABEL}>
            Start date
          </label>
          <input
            id="sm-start"
            type="date"
            value={startDate}
            className={SM_INPUT}
            onChange={(e) => {
              setStartDate(e.target.value);
            }}
            onBlur={() => {
              save();
            }}
          />
        </div>

        <div>
          <label htmlFor="sm-end-date" className={SM_LABEL}>
            End date
          </label>
          <input
            id="sm-end-date"
            type="date"
            value={endDate}
            className={SM_INPUT}
            onChange={(e) => {
              setEndDate(e.target.value);
            }}
            onBlur={() => {
              save();
            }}
          />
        </div>

        <div>
          <label htmlFor="sm-tz" className={SM_LABEL}>
            Time zone
          </label>
          <select
            id="sm-tz"
            value={timezone}
            className={SM_SELECT}
            onChange={(e) => {
              setTimezone(e.target.value);
              save({ timezone: e.target.value });
            }}
          >
            <option value="">Not set</option>
            {[
              { id: 'America/New_York', label: 'Eastern (America/New_York)' },
              { id: 'America/Chicago', label: 'Central (America/Chicago)' },
              { id: 'America/Denver', label: 'Mountain (America/Denver)' },
              { id: 'America/Phoenix', label: 'Mountain, no DST (America/Phoenix)' },
              { id: 'America/Los_Angeles', label: 'Pacific (America/Los_Angeles)' },
              { id: 'America/Anchorage', label: 'Alaska (America/Anchorage)' },
              { id: 'Pacific/Honolulu', label: 'Hawaii (Pacific/Honolulu)' },
              { id: 'America/Toronto', label: 'Eastern — Canada (America/Toronto)' },
              { id: 'Europe/London', label: 'UK (Europe/London)' },
            ].map((tz) => (
              <option key={tz.id} value={tz.id}>
                {tz.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="sm-rider-no" className={SM_LABEL}>
            Starting rider number
          </label>
          <input
            id="sm-rider-no"
            type="number"
            min={1}
            value={startingRiderNumber}
            placeholder="101"
            className={SM_INPUT}
            onChange={(e) => {
              setStartingRiderNumber(Number(e.target.value));
            }}
            onBlur={() => {
              save();
            }}
          />
          <p className="mt-2 text-[12.5px] leading-[1.5] text-[#7C8A84] text-pretty">
            Rider #1 checked in gets this number — e.g. 200 instead of the default 101.
          </p>
        </div>
      </div>

      {showType === 'rated' && (
        <div className="mt-[22px]">
          <div className="mb-[7px] text-[10px] font-bold uppercase tracking-[.14em] text-[#6E7C76]">
            Governing bodies
          </div>
          <p className="mb-3 max-w-[900px] text-[12.5px] leading-[1.5] text-[#6E7C76] text-pretty">
            Scores are certified/reportable to whichever bodies are checked here. A Schooling Show
            runs the exact same test catalog and scoring, just with none checked — nothing is
            reported to a federation.
          </p>
          <div className="flex flex-wrap items-center gap-[22px]">
            {SHOW_DETAILS_BODIES.map((body) => (
              <label
                key={body}
                className="inline-flex items-center gap-2 text-[13.5px] text-ink-deep"
              >
                <input
                  type="checkbox"
                  checked={governingBodies.includes(body)}
                  className="size-[15px] accent-[#1A5B3C]"
                  onChange={() => {
                    toggleBody(body);
                  }}
                />
                {body}
              </label>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}

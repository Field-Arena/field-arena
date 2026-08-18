'use client';

import { useState } from 'react';
import type { UpdateShowDetailsInput } from '@/modules/shows/schemas';
import type { ShowSetupDetail } from '@/modules/shows/data/setup-queries';
import { useUpdateShowDetails } from '@/modules/shows/hooks/use-show-mutations';
import { SHOW_DETAILS_BODIES } from '@/modules/shows/constants';
import { Card } from '@/shared/ui/organizer/card';
import { GhostButton } from '@/shared/ui/organizer/buttons';
import { Input } from '@/shared/ui/shadcn/input';
import {
  SM_CARD_PAD,
  SM_SECTION_HEAD,
  SM_LABEL,
  SM_INPUT,
  SM_SELECT,
} from '@/modules/shows/ui/show-manager/tokens';

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

  const dateFields: { id: string; label: string; value: string; onChange: (v: string) => void }[] =
    [
      { id: 'sm-start', label: 'Start date', value: startDate, onChange: setStartDate },
      { id: 'sm-end-date', label: 'End date', value: endDate, onChange: setEndDate },
    ];

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
        <Input
          id="sm-name"
          value={name}
          placeholder="Name this show"
          className={`h-auto ${SM_INPUT}`}
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
            <Input
              autoFocus
              value={org}
              className={`h-auto ${SM_INPUT}`}
              onChange={(e) => {
                setOrg(e.target.value);
              }}
              onBlur={() => {
                save();
              }}
            />
          ) : (
            <div className="text-ink-deep border-b border-[#EDF0EE] pb-[13px] text-[14.5px]">
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

        {dateFields.map((f) => (
          <div key={f.id}>
            <label htmlFor={f.id} className={SM_LABEL}>
              {f.label}
            </label>
            <Input
              id={f.id}
              type="date"
              value={f.value}
              className={`h-auto ${SM_INPUT}`}
              onChange={(e) => {
                f.onChange(e.target.value);
              }}
              onBlur={() => {
                save();
              }}
            />
          </div>
        ))}

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
          <Input
            id="sm-rider-no"
            type="number"
            min={1}
            value={startingRiderNumber}
            placeholder="101"
            className={`h-auto ${SM_INPUT}`}
            onChange={(e) => {
              setStartingRiderNumber(Number(e.target.value));
            }}
            onBlur={() => {
              save();
            }}
          />
          <p className="mt-2 text-[12.5px] leading-[1.5] text-pretty text-[#7C8A84]">
            Rider #1 checked in gets this number — e.g. 200 instead of the default 101.
          </p>
        </div>
      </div>

      {showType === 'rated' && (
        <div className="mt-[22px]">
          <div className="mb-[7px] text-[10px] font-bold tracking-[.14em] text-[#6E7C76] uppercase">
            Governing bodies
          </div>
          <p className="mb-3 max-w-[900px] text-[12.5px] leading-[1.5] text-pretty text-[#6E7C76]">
            Scores are certified/reportable to whichever bodies are checked here. A Schooling Show
            runs the exact same test catalog and scoring, just with none checked — nothing is
            reported to a federation.
          </p>
          <div className="flex flex-wrap items-center gap-[22px]">
            {SHOW_DETAILS_BODIES.map((body) => (
              <label
                key={body}
                className="text-ink-deep inline-flex items-center gap-2 text-[13.5px]"
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

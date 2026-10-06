'use client';

import type { ShowSetupDetail } from '@/modules/shows/types';
import { useShowDetailsForm } from '@/modules/shows/hooks/use-show-details-form';
import { SHOW_DETAILS_BODIES } from '@/modules/shows/constants';
import { Card } from '@/shared/ui/organizer/card';
import { Input } from '@/shared/ui/shadcn/input';
import { Label } from '@/shared/ui/shadcn/label';
import {
  SM_CARD_PAD,
  SM_LABEL,
  SM_INPUT,
  SM_NOTE,
  SM_SELECT,
} from '@/modules/shows/ui/show-manager/tokens';
import { useSyncExternalStore } from 'react';
import { SmHead } from './sm-head';
import { localTodayIso } from '@/modules/shows/utils/today-iso';

const noopSubscribe = () => () => undefined;

const TIMEZONES = [
  { id: 'America/New_York', label: 'Eastern (America/New_York)' },
  { id: 'America/Chicago', label: 'Central (America/Chicago)' },
  { id: 'America/Denver', label: 'Mountain (America/Denver)' },
  { id: 'America/Phoenix', label: 'Mountain, no DST (America/Phoenix)' },
  { id: 'America/Los_Angeles', label: 'Pacific (America/Los_Angeles)' },
  { id: 'America/Anchorage', label: 'Alaska (America/Anchorage)' },
  { id: 'Pacific/Honolulu', label: 'Hawaii (Pacific/Honolulu)' },
  { id: 'America/Toronto', label: 'Eastern — Canada (America/Toronto)' },
  { id: 'Europe/London', label: 'UK (Europe/London)' },
] as const;

const BODY_NAMES: Record<string, string> = {
  FEI: 'Fédération Équestre Internationale',
  USDF: 'United States Dressage Federation',
  USEF: 'United States Equestrian Federation',
};

export function ShowDetailsCard({ show }: { show: ShowSetupDetail }) {
  // Local "today", filled in after hydration so the server's UTC date can't mismatch.
  const todayIso = useSyncExternalStore(noopSubscribe, localTodayIso, () => undefined);
  const {
    name,
    setName,
    org,
    setOrg,
    orgEditing,
    toggleOrgEditing,
    showType,
    setShowType,
    timezone,
    setTimezone,
    startingRiderNumber,
    setStartingRiderNumber,
    governingBodies,
    toggleBody,
    dateFields,
    save,
  } = useShowDetailsForm(show);

  return (
    <>
      <Card className={SM_CARD_PAD}>
        <SmHead
          icon="details"
          title="Show details"
          sub="The basics riders see on the ticket page"
        />

        <div className="grid grid-cols-1 gap-x-5 gap-y-[18px] sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label htmlFor="sm-name" className={SM_LABEL}>
              Show name <span className="text-[#B42318]">*</span>
            </Label>
            <Input
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

          <div>
            <div className="mb-1.5 flex items-center gap-3">
              <span className={`${SM_LABEL} mb-0 flex-1`}>Organization / club name</span>
              <button
                type="button"
                className="text-[12px] font-semibold text-[#146A47] hover:underline"
                onClick={toggleOrgEditing}
              >
                {orgEditing ? 'Done' : 'Edit'}
              </button>
            </div>
            {orgEditing ? (
              <Input
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
              <div className="flex h-10 items-center rounded-[10px] border border-[#EEF1F4] bg-[#FBFCFD] px-3 text-[13.5px] text-[#101828]">
                {org || <span className="text-[#8A94A3]">Not set</span>}
              </div>
            )}
          </div>

          <div>
            <Label htmlFor="sm-showtype" className={SM_LABEL}>
              Show type
            </Label>
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
              <Label htmlFor={f.id} className={SM_LABEL}>
                {f.label}
              </Label>
              <Input
                id={f.id}
                type="date"
                min={todayIso}
                value={f.value}
                className={SM_INPUT}
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
            <Label htmlFor="sm-tz" className={SM_LABEL}>
              Time zone
            </Label>
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
              {TIMEZONES.map((tz) => (
                <option key={tz.id} value={tz.id}>
                  {tz.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label htmlFor="sm-rider-no" className={SM_LABEL}>
              Starting rider number
            </Label>
            <Input
              id="sm-rider-no"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={startingRiderNumber === 0 ? '' : String(startingRiderNumber)}
              placeholder="101"
              className={SM_INPUT}
              onFocus={(e) => {
                e.target.select();
              }}
              onChange={(e) => {
                const digits = e.target.value.replace(/\D/g, '').slice(0, 5);
                setStartingRiderNumber(digits === '' ? 0 : Number(digits));
              }}
              onBlur={() => {
                const clamped = Math.min(Math.max(startingRiderNumber, 1), 99999);
                if (clamped !== startingRiderNumber) setStartingRiderNumber(clamped);
                save({ startingRiderNumber: clamped });
              }}
            />
            <p className="mt-1.5 text-[11.5px] text-[#8A94A3]">
              Rider #1 checked in gets this number — e.g. 200 instead of the default 101.
            </p>
          </div>
        </div>
      </Card>

      {showType === 'rated' && (
        <Card className={SM_CARD_PAD}>
          <SmHead
            icon="bodies"
            title="Governing bodies"
            sub="Which sanctioning bodies recognize this show"
          />
          <p className={SM_NOTE}>
            Scores are certified/reportable to whichever bodies are on. A Schooling Show runs the
            exact same test catalog and scoring, just with none on — nothing is reported to a
            federation.
          </p>
          {SHOW_DETAILS_BODIES.map((body) => {
            const on = governingBodies.includes(body);
            return (
              <div key={body} className="fa-switch-row">
                <div className="fa-sr-lab">
                  <b>{body}</b>
                  <span>{BODY_NAMES[body] ?? body}</span>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={on}
                  aria-label={`${body} sanctioned`}
                  className={`fa-switch ${on ? 'fa-on' : ''}`}
                  onClick={() => {
                    toggleBody(body);
                  }}
                />
              </div>
            );
          })}
        </Card>
      )}
    </>
  );
}

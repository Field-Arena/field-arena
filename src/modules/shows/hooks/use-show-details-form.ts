'use client';

import { useRef, useState } from 'react';
import type { UpdateShowDetailsInput } from '@/modules/shows/schemas';
import type { ShowSetupDetail } from '@/modules/shows/data/setup-queries';
import { useUpdateShowDetails } from '@/modules/shows/hooks/use-show-mutations';
import type { SHOW_DETAILS_BODIES } from '@/modules/shows/constants';

function sameBodies(a: readonly string[], b: readonly string[]) {
  return a.length === b.length && a.every((body) => b.includes(body));
}

interface ShowDetailsSnapshot {
  name: string;
  org: string;
  showType: ShowSetupDetail['showType'];
  startDate: string;
  endDate: string;
  timezone: string;
  startingRiderNumber: number;
  governingBodies: string[];
}

export function useShowDetailsForm(show: ShowSetupDetail) {
  const [name, setName] = useState(show.name);
  const [org, setOrg] = useState(show.org ?? '');
  const [orgEditing, setOrgEditing] = useState(false);
  const [showType, setShowType] = useState(show.showType);
  const [startDate, setStartDate] = useState(show.startDate ?? '');
  const [endDate, setEndDate] = useState(show.endDate ?? '');
  const [timezone, setTimezone] = useState(show.timezone ?? '');
  const [startingRiderNumber, setStartingRiderNumber] = useState(show.startingRiderNumber);
  const [governingBodies, setGoverningBodies] = useState<string[]>(show.governingBodies);

  const lastSaved = useRef({
    name: show.name,
    org: show.org ?? '',
    showType: show.showType,
    startDate: show.startDate ?? '',
    endDate: show.endDate ?? '',
    timezone: show.timezone ?? '',
    startingRiderNumber: show.startingRiderNumber,
    governingBodies: show.governingBodies,
  });

  const { mutate } = useUpdateShowDetails();

  const dateFields: { id: string; label: string; value: string; onChange: (v: string) => void }[] =
    [
      { id: 'sm-start', label: 'Start date', value: startDate, onChange: setStartDate },
      { id: 'sm-end-date', label: 'End date', value: endDate, onChange: setEndDate },
    ];

  function save(overrides: Partial<ShowDetailsSnapshot> = {}) {
    const payload = {
      showId: show.id,
      name,
      org,
      showType,
      startDate,
      endDate,
      timezone,
      startingRiderNumber,
      governingBodies,
      ...overrides,
    };
    const last = lastSaved.current;
    const unchanged =
      payload.name === last.name &&
      payload.org === last.org &&
      payload.showType === last.showType &&
      payload.startDate === last.startDate &&
      payload.endDate === last.endDate &&
      payload.timezone === last.timezone &&
      payload.startingRiderNumber === last.startingRiderNumber &&
      sameBodies(payload.governingBodies, last.governingBodies);
    if (unchanged) return;
    lastSaved.current = payload;
    mutate({
      ...payload,
      governingBodies: payload.governingBodies as UpdateShowDetailsInput['governingBodies'],
    });
  }

  function toggleBody(body: (typeof SHOW_DETAILS_BODIES)[number]) {
    const next = governingBodies.includes(body)
      ? governingBodies.filter((b) => b !== body)
      : [...governingBodies, body];
    setGoverningBodies(next);
    save({ governingBodies: next });
  }

  function toggleOrgEditing() {
    if (orgEditing) save();
    setOrgEditing((v) => !v);
  }

  return {
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
  };
}

/* Who last set each USEF detail on a horse.
 *
 * `horses.usef_field_meta` maps a column name to { source, by, byId, at }. A
 * horse (and its details) carries from show to show and can be edited by the
 * rider and by an organizer of a show it is entered in, so every value says
 * where it came from. The planned USEF integration may only refresh values whose
 * source is 'usef' silently; anything a person typed is flagged instead. */

/** The horse columns tracked: the USEF detail columns plus trainer name/phone. */
export const USEF_META_FIELDS = [
  'usef_number',
  'fei_number',
  'passport_number',
  'registration_number',
  'year_of_birth',
  'breed',
  'owner_name',
  'owner_email',
  'owner_usef',
  'owner_usef_exempt_reason',
  'owner_street',
  'owner_city',
  'owner_state',
  'owner_zip',
  'trainer',
  'trainer_phone',
  'trainer_usef',
  'trainer_street',
  'trainer_city',
  'trainer_state',
  'trainer_zip',
] as const;

export type UsefMetaField = (typeof USEF_META_FIELDS)[number];

export type UsefValueSource = 'rider' | 'organizer' | 'usef';

export interface UsefFieldStamp {
  source: UsefValueSource;
  /** Display name of whoever set it (or "USEF"). */
  by: string;
  /** User id of whoever set it, so a viewer can be told "you". */
  byId: string | null;
  /** ISO timestamp. */
  at: string;
}

export type UsefFieldMeta = Partial<Record<UsefMetaField, UsefFieldStamp>>;

export type UsefFieldValues = Partial<Record<UsefMetaField, string | null>>;

const TRACKED = new Set<string>(USEF_META_FIELDS);
const SOURCES = new Set<string>(['rider', 'organizer', 'usef']);

/** Read the stored jsonb defensively: anything malformed is dropped, never thrown. */
export function parseUsefMeta(raw: unknown): UsefFieldMeta {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) return {};
  const out: UsefFieldMeta = {};
  for (const [key, value] of Object.entries(raw)) {
    if (!TRACKED.has(key)) continue;
    if (typeof value !== 'object' || value === null) continue;
    const entry = value as Record<string, unknown>;
    if (typeof entry.source !== 'string' || !SOURCES.has(entry.source)) continue;
    if (typeof entry.at !== 'string' || Number.isNaN(Date.parse(entry.at))) continue;
    out[key as UsefMetaField] = {
      source: entry.source as UsefValueSource,
      by: typeof entry.by === 'string' ? entry.by : '',
      byId: typeof entry.byId === 'string' ? entry.byId : null,
      at: entry.at,
    };
  }
  return out;
}

function norm(value: string | null | undefined): string {
  return (value ?? '').trim();
}

/** The fields among `updates` whose value actually differs from what is stored. */
export function changedUsefFields(
  existing: UsefFieldValues,
  updates: UsefFieldValues,
): UsefMetaField[] {
  return USEF_META_FIELDS.filter(
    (field) => Object.hasOwn(updates, field) && norm(updates[field]) !== norm(existing[field]),
  );
}

/** Stamp only the fields that really changed; leave every other stamp as it was.
 *  A save that re-sends unchanged values must not take credit for them (or wipe
 *  an organizer's "updated by" note). */
export function stampChangedFields(
  existing: UsefFieldValues,
  updates: UsefFieldValues,
  meta: UsefFieldMeta,
  stamp: UsefFieldStamp,
): UsefFieldMeta {
  const next: UsefFieldMeta = { ...meta };
  for (const field of changedUsefFields(existing, updates)) next[field] = { ...stamp };
  return next;
}

/** May a future USEF sync overwrite this value without asking anyone?
 *  Only an empty value, or one that USEF itself set. */
export function canSyncOverwrite(
  meta: UsefFieldMeta,
  field: UsefMetaField,
  currentValue: string | null | undefined,
): boolean {
  if (norm(currentValue) === '') return true;
  return meta[field]?.source === 'usef';
}

export type HorseEditAccess = 'allowed' | 'not-entered' | 'denied';

/** Decide whether the caller may edit a horse. `shows` has one entry per show the
 *  horse is entered in, with whether the caller has the approve-documents grant
 *  there (the same grant the horses_update_document_approval policy checks). */
export function decideHorseEditAccess(shows: readonly { allowed: boolean }[]): HorseEditAccess {
  if (shows.length === 0) return 'not-entered';
  return shows.some((show) => show.allowed) ? 'allowed' : 'denied';
}

function sameLocalDay(a: Date, b: Date, timeZone?: string): boolean {
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return fmt.format(a) === fmt.format(b);
}

/** "today 10:02 AM", or "Nov 12" for an earlier day. */
export function formatStampTime(iso: string, now: Date, timeZone?: string): string {
  const when = new Date(iso);
  if (Number.isNaN(when.getTime())) return '';
  if (sameLocalDay(when, now, timeZone)) {
    const time = new Intl.DateTimeFormat('en-US', {
      timeZone,
      hour: 'numeric',
      minute: '2-digit',
    }).format(when);
    return `today ${time}`;
  }
  return new Intl.DateTimeFormat('en-US', { timeZone, month: 'short', day: 'numeric' }).format(
    when,
  );
}

export type StampPillTone = 'blue' | 'grey' | 'green';

export interface StampPill {
  label: string;
  tone: StampPillTone;
}

/** The small pill next to a field on the organizer's card. */
export function stampPill(
  stamp: UsefFieldStamp | undefined,
  viewerId: string | null,
  now: Date,
  timeZone?: string,
): StampPill | null {
  if (!stamp) return null;
  if (stamp.source === 'usef') return { label: 'verified by USEF', tone: 'green' };
  if (stamp.source === 'rider') return { label: 'rider', tone: 'blue' };
  const who = viewerId !== null && stamp.byId === viewerId ? 'you' : stamp.by || 'organizer';
  return { label: `${who} · ${formatStampTime(stamp.at, now, timeZone)}`, tone: 'grey' };
}

/** The note under a field on the rider's own form. Riders are only told about
 *  organizer changes; their own edits need no label. */
export function organizerChangeNote(
  stamp: UsefFieldStamp | undefined,
  now: Date,
  timeZone?: string,
): string | null {
  if (stamp?.source !== 'organizer') return null;
  return `Updated by organizer ${formatStampTime(stamp.at, now, timeZone)}`;
}

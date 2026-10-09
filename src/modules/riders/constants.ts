export const ORDER_STATUSES = ['pending', 'paid', 'failed', 'abandoned'] as const;

export const CLASS_ENTRY_STATUSES = ['scheduled', 'scored', 'scratched', 'disqualified'] as const;

export const NON_CAPPED_ENTRY_STATUS = 'scratched' as const;

export const RIDER_CATEGORIES = [
  'Adult Amateur',
  'Open',
  'Senior',
  'Young Rider',
  'Junior',
  'Children',
  'Under 25 (U25)',
] as const;

/* The rider division a single class entry is ridden in (class_entries.division
 * — the J/Y/A/O code the awards engine splits ribbons by). Chosen per class at
 * entry rather than once on the rider profile: the same rider can ride Open in
 * one class and Adult Amateur in another. */
export const ENTRY_DIVISION_CODES = ['O', 'A', 'Y', 'J'] as const;

export const ENTRY_DIVISION_OPTIONS = [
  { code: 'O', label: 'Open' },
  { code: 'A', label: 'Adult Amateur' },
  { code: 'Y', label: 'Young Rider' },
  { code: 'J', label: 'Junior' },
] as const;

/* Organizer-required documents whose label reads as an agreement the rider
 * accepts (rather than a certificate they already hold) are signed on the
 * site instead of uploaded. Certificate-style words win over agreement words,
 * so "Coggins", "Health certificate", "Safe Sport certificate" stay uploads. */
export const UPLOAD_DOCUMENT_KEYWORDS =
  /coggins|vaccin|health|certificate|cert\b|passport|membership|card|insurance|proof|record|test result|safe ?sport|registration papers|photo|\bid\b/i;

export const SIGNABLE_DOCUMENT_KEYWORDS =
  /waiver|release|hold harmless|harmless|agreement|agree|consent|acknowledg|liabilit|indemn|rules|policy|policies|terms|code of conduct|conduct|declaration|permission|authori[sz]ation|contract|pledge|affidavit/i;

export const ORDER_LINE_ITEM_KINDS = ['class_entry', 'qualification', 'addon'] as const;

export const HORSE_DOCUMENTS_BUCKET = 'horse-documents';

export const HORSE_DOCUMENT_SIGNED_URL_TTL_SECONDS = 60 * 10;

export const UNLIMITED_ADD_ON_QUANTITY_INPUT_MAX = 50;

export const DEFAULT_STARTING_RIDER_NUMBER = 101;

export const RIDER_NUMBER_PAD_WIDTH = 4;

export const SUPERADMIN_CONSOLE_ROUTE = '/dashboard/superadmin';

/* Remembers the last few shows a rider opened an entry page for, so the rider
 * portal home can list "the show you came from" even before anything is
 * saved for it. A convenience only — holds show ids, nothing personal. */
export const RIDER_RECENT_SHOWS_COOKIE = 'fa_rider_recent_shows';

export const RIDER_RECENT_SHOWS_MAX = 5;

export const RIDER_RECENT_SHOWS_MAX_AGE_SECONDS = 60 * 60 * 24 * 90;

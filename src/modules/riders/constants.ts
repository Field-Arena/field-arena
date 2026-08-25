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

export const ORDER_LINE_ITEM_KINDS = ['class_entry', 'qualification', 'addon'] as const;

export const HORSE_DOCUMENTS_BUCKET = 'horse-documents';

export const HORSE_DOCUMENT_SIGNED_URL_TTL_SECONDS = 60 * 10;

export const UNLIMITED_ADD_ON_QUANTITY_INPUT_MAX = 50;

export const DEFAULT_STARTING_RIDER_NUMBER = 101;

export const RIDER_NUMBER_PAD_WIDTH = 4;

export const SUPERADMIN_CONSOLE_ROUTE = '/dashboard/superadmin';

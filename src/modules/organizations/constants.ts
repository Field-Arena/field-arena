export const RING_SIZES = [
  { id: 'standard', label: 'Standard (20m × 60m)' },
  { id: 'small', label: 'Small (20m × 40m)' },
] as const;

export const MAX_RINGS = 30;

export const MAX_STABLES = 40;

export const MAX_STALLS_PER_STABLE = 300;

export const VENUE_STAT_TINTS = [
  { bg: '#E3EDFB', fg: '#2E5FA8' },
  { bg: '#EEE7FA', fg: '#6B4FA0' },
  { bg: '#FCF3E4', fg: '#8A6D14' },
] as const;

export const MEMBER_TYPES = [
  'Organizer',
  'Show Admin',
  'Judge',
  'Scribe',
  'Announcer',
  'ShowStaff',
  'Vendor',
  'Rider',
  'Member',
] as const;

export type MemberType = (typeof MEMBER_TYPES)[number];

export const MEMBER_COLUMNS = [
  { key: 'role', label: 'Type' },
  { key: 'email', label: 'Email' },
  { key: 'phone', label: 'Phone' },
  { key: 'membershipStatus', label: 'Membership' },
  { key: 'membershipExpires', label: 'Expires' },
  { key: 'notes', label: 'Notes' },
] as const;

export type MemberColumnKey = (typeof MEMBER_COLUMNS)[number]['key'];

export const MEMBER_ROW_CAP = 200;

export const MEMBER_CSV_HEADERS = [
  'First name',
  'Last name',
  'Type',
  'Phone',
  'Email',
  'Notes',
] as const;

export const MEMBERS_PATH = '/dashboard/members';

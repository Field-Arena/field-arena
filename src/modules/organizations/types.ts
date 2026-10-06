export interface VenueRing {
  name: string;
  size: 'standard' | 'small';
}

export interface VenueStall {
  id: string;
  number: number;
  label: string;
  closed: boolean;
}

export interface VenueStable {
  name: string;
  rowCount: number;
  stalls: VenueStall[];
}

export interface VenueListItem {
  id: string;
  name: string;
  address: string | null;
  website: string | null;
  phone: string | null;
  contact: string | null;
  city: string | null;
  region: string | null;
  rings: VenueRing[];
  stables: VenueStable[];

  showCount: number;
}

/** The editable profile fields the onboarding form loads and saves. */
export interface OrganizationProfile {
  id: string;
  name: string;
  email: string | null;
  website: string | null;
  phone: string | null;
  city: string | null;
  region: string | null;
  country: string | null;
}

export interface MemberRow {
  id: string;
  name: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  phone: string | null;
  role: string | null;
  membershipStatus: string;
  membershipExpires: string | null;
  notes: string | null;

  extraFields: Record<string, string>;
}

export interface TestTemplateRow {
  id: string;
  name: string;
  level: string | null;
  sourceLabel: string | null;
  movementCount: number;
}

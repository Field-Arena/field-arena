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

export type ShowStatus = 'today' | 'upcoming' | 'completed';

export interface AnnouncerShow {
  id: string;
  slug: string | null;
  name: string;
  dateLabel: string | null;
  startDate: string | null;
  endDate: string | null;
  status: ShowStatus;
}

export interface RingEntrySummary {
  num: string;
  rider: string | null;
  horse: string | null;
}

export interface RingRow {
  className: string;
  classId: string;
  ring: string | null;
  scoringOpen: boolean;
  position: number;
  entryCount: number;

  current: RingEntrySummary | null;

  upNext: RingEntrySummary[];
}

export interface ResultRow {
  classLabel: string;
  num: string;
  rider: string | null;
  horse: string | null;
  finalPct: string | null;
  place: number;
}

export interface ScheduleRow {
  classId: string;
  className: string;
  ring: string | null;
  date: string | null;
  time: string | null;
  entryCount: number;
  scoringOpen: boolean;
}

export interface HistoryRow {
  showId: string;
  showSlug: string | null;
  showName: string;
  dateLabel: string | null;
  startDate: string | null;
  classCount: number;
  scoredCount: number;
}

export interface ShowContact {
  staffId: string;
  name: string;
  role: string;
  phone: string | null;
}

export interface ShowDocument {
  id: string;
  name: string;

  url: string | null;
}

import { ScorecardLink } from '@/modules/riders/ui/scorecard-modal';
import {
  LEGACY_COLOR,
  LegacySecTitle,
  legacyButtonGhostStyle,
  legacyCardStyle,
  legacyPillStyle,
  legacyRideMetaStyle,
  legacyRideNumStyle,
  legacyRideRowStyle,
  legacyRideScoreStyle,
  legacyRideTitleStyle,
  legacySecNoteStyle,
  legacyTableCellStyle,
  legacyTableHeadCellStyle,
  legacyTableStyle,
} from '@/modules/riders/ui/legacy-theme';
import { classSubtitle } from '@/modules/riders/utils/class-subtitle';
import { formatDateRange } from '@/shared/lib/format/date';
import type { ClassWithCapacity, RiderEntryDetail, ShowRow } from '@/modules/riders/types';
import { Button } from '@/shared/ui/shadcn/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/ui/shadcn/table';

function entryClassName(cls: { label: string; displayName: string | null }): string {
  return (cls.displayName?.trim() ?? '') || cls.label;
}

function classDisplayName(cls: ClassWithCapacity): string {
  return (cls.display_name?.trim() ?? '') || cls.label;
}

interface ShowDetailsFields {
  org: string | null;
  website: string | null;
  phone: string | null;
  contactEmail: string | null;
}

function parseShowDetails(raw: unknown): ShowDetailsFields {
  const value = (raw ?? {}) as {
    org?: string;
    website?: string;
    phone?: string;
    contactEmail?: string;
  };
  return {
    org: (value.org?.trim() ?? '') || null,
    website: (value.website?.trim() ?? '') || null,
    phone: (value.phone?.trim() ?? '') || null,
    contactEmail: (value.contactEmail?.trim() ?? '') || null,
  };
}

export function ScheduleTab({
  show,
  venueAddress,
  entries,
  classes,
  onViewResults,
  hasResults,
}: {
  show: ShowRow;
  venueAddress: string | null;
  entries: RiderEntryDetail[];
  classes: ClassWithCapacity[];
  onViewResults: () => void;
  hasResults: boolean;
}) {
  const enteredClassIds = new Set(entries.map((entry) => entry.classId));
  const details = parseShowDetails(show.show_details);
  const recognition =
    Array.isArray(show.governing_bodies) && show.governing_bodies.length > 0
      ? `${(show.governing_bodies as string[]).join(' / ')} recognized`
      : null;
  const showOffice = [details.phone, details.contactEmail].filter(Boolean).join(' · ') || null;
  const dates = formatDateRange(show.start_date, show.end_date) || show.date_label;

  return (
    <div>
      <div style={legacyCardStyle}>
        <LegacySecTitle>Show details</LegacySecTitle>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '8px 20px',
            fontSize: 13.5,
            marginTop: 8,
          }}
        >
          <ShowDetailField label="Show" value={show.name} />
          <ShowDetailField label="Organizer" value={details.org} />
          <ShowDetailField label="Dates" value={dates} />
          <ShowDetailField label="Recognition" value={recognition} />
          <ShowDetailField label="Venue" value={show.venue_name} />
          <ShowDetailField label="Address" value={venueAddress} />
          <ShowDetailField label="Show office" value={showOffice} />
          <ShowDetailField label="Website" value={details.website} />
        </div>
      </div>

      <div style={legacyCardStyle}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 10,
          }}
        >
          <LegacySecTitle style={{ margin: 0 }}>Your rides</LegacySecTitle>
          {hasResults && (
            <Button
              type="button"
              variant="ghost"
              style={legacyButtonGhostStyle}
              onClick={onViewResults}
            >
              🏆 View Results
            </Button>
          )}
        </div>
        <p style={legacySecNoteStyle}>
          Every class you&apos;re entered in, in order. Once a ride is complete, your score shows
          here — tap it for the full scorecard.
        </p>
        {entries.length === 0 && (
          <p style={{ fontSize: 13.5, color: LEGACY_COLOR.inkSoft }}>No classes entered yet.</p>
        )}
        {entries.map((entry, index) => {
          const subtitle = entry.class ? classSubtitle(entry.class) : null;
          return (
            <div key={entry.id} style={legacyRideRowStyle}>
              <div style={legacyRideNumStyle}>{index + 1}</div>
              <div style={{ flex: 1, minWidth: 180 }}>
                <div style={legacyRideTitleStyle}>
                  {entry.class ? entryClassName(entry.class) : 'Class'}
                  {entry.class?.division ? ` (${entry.class.division})` : ''}
                </div>
                {subtitle && (
                  <div style={{ fontStyle: 'italic', fontSize: 11.5, color: LEGACY_COLOR.inkSoft }}>
                    {subtitle}
                  </div>
                )}
                <div style={legacyRideMetaStyle}>
                  {entry.class
                    ? [entry.class.date, entry.class.time, entry.class.arena]
                        .filter(Boolean)
                        .join(' · ')
                    : ''}
                </div>
              </div>
              <RideStatus entry={entry} />
            </div>
          );
        })}
      </div>

      <div style={legacyCardStyle}>
        <LegacySecTitle>Full event schedule</LegacySecTitle>
        <p style={legacySecNoteStyle}>Every class at this show. Your entries are highlighted.</p>
        <Table style={legacyTableStyle}>
          <TableHeader>
            <TableRow>
              <TableHead style={legacyTableHeadCellStyle}>Date</TableHead>
              <TableHead style={legacyTableHeadCellStyle}>Time</TableHead>
              <TableHead style={legacyTableHeadCellStyle}>Ring</TableHead>
              <TableHead style={legacyTableHeadCellStyle}>Class</TableHead>
              <TableHead style={legacyTableHeadCellStyle}>Division</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {classes.map((cls) => {
              const subtitle = classSubtitle({
                label: cls.label,
                displayName: cls.display_name,
                testOptions: cls.test_options,
              });
              const mine = enteredClassIds.has(cls.id);
              return (
                <TableRow
                  key={cls.id}
                  style={mine ? { background: LEGACY_COLOR.hunterPale } : undefined}
                >
                  <TableCell style={legacyTableCellStyle}>{(cls.date ?? '') || 'TBD'}</TableCell>
                  <TableCell style={legacyTableCellStyle}>{(cls.time ?? '') || 'TBD'}</TableCell>
                  <TableCell style={legacyTableCellStyle}>{cls.arena}</TableCell>
                  <TableCell style={legacyTableCellStyle}>
                    {classDisplayName(cls)}
                    {mine && (
                      <span style={{ ...legacyPillStyle('ok'), marginLeft: 8 }}>
                        You&apos;re entered
                      </span>
                    )}
                    {subtitle && (
                      <div
                        style={{ fontStyle: 'italic', fontSize: 11.5, color: LEGACY_COLOR.inkSoft }}
                      >
                        {subtitle}
                      </div>
                    )}
                  </TableCell>
                  <TableCell style={legacyTableCellStyle}>{cls.division}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function ShowDetailField({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <span
        style={{
          color: LEGACY_COLOR.inkSoft,
          display: 'block',
          fontSize: 11,
          textTransform: 'uppercase',
          letterSpacing: 0.4,
        }}
      >
        {label}
      </span>
      <b style={{ color: LEGACY_COLOR.ink, fontWeight: 600 }}>{value ?? '—'}</b>
    </div>
  );
}

function RideStatus({ entry }: { entry: RiderEntryDetail }) {
  if (entry.status === 'scratched') return <span style={legacyPillStyle('bad')}>Scratched</span>;
  if (entry.status === 'disqualified') {
    return (
      <span style={legacyPillStyle('bad')}>
        Disqualified{entry.reason ? ` — ${entry.reason}` : ''}
      </span>
    );
  }
  const pct = entry.finalPct != null ? Number(entry.finalPct) : null;
  if (pct != null && !Number.isNaN(pct)) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
        <span style={legacyRideScoreStyle}>{pct.toFixed(3)}%</span>
        <ScorecardLink entryId={entry.id} />
      </div>
    );
  }
  return <span style={{ fontSize: 12.5, color: LEGACY_COLOR.inkSoft }}>Upcoming</span>;
}

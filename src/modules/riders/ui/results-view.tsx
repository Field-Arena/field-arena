import { ScorecardLink } from '@/modules/riders/ui/scorecard-modal';
import {
  LEGACY_COLOR,
  LegacySecTitle,
  legacyButtonGhostStyle,
  legacyCardStyle,
  legacySecNoteStyle,
  legacyTableCellStyle,
  legacyTableHeadCellStyle,
  legacyTableStyle,
} from '@/modules/riders/ui/legacy-theme';
import { classSubtitle } from '@/modules/riders/utils/class-subtitle';
import type { RiderEntryDetail } from '@/modules/riders/types';
import { Button } from '@/shared/ui/shadcn/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/ui/shadcn/table';

function classDisplayName(cls: { label: string; displayName: string | null }): string {
  return (cls.displayName?.trim() ?? '') || cls.label;
}

export function ResultsView({
  entries,
  onBack,
}: {
  entries: RiderEntryDetail[];
  onBack: () => void;
}) {
  const completed = entries.filter((entry) => {
    if (entry.finalPct == null) return false;
    return !Number.isNaN(Number(entry.finalPct));
  });

  return (
    <div>
      <Button
        type="button"
        variant="ghost"
        style={{ ...legacyButtonGhostStyle, marginBottom: 14 }}
        onClick={onBack}
      >
        ← Back to My Schedule
      </Button>

      <div style={legacyCardStyle}>
        <LegacySecTitle>Results</LegacySecTitle>
        <p style={legacySecNoteStyle}>Placings and ribbons for your classes, as scores come in.</p>

        {completed.length === 0 ? (
          <p style={{ fontSize: 13.5, color: LEGACY_COLOR.inkSoft }}>
            No completed classes yet — results will show here once you have some.
          </p>
        ) : (
          completed.map((entry) => {
            const subtitle = entry.class ? classSubtitle(entry.class) : null;
            return (
              <div key={entry.id} style={{ marginBottom: 20 }}>
                <div
                  style={{
                    fontWeight: 700,
                    color: LEGACY_COLOR.ink,
                    marginBottom: subtitle ? 0 : 6,
                  }}
                >
                  {entry.class ? classDisplayName(entry.class) : 'Class'}
                  {entry.class?.division ? ` (${entry.class.division})` : ''}
                </div>
                {subtitle && (
                  <div
                    style={{
                      fontStyle: 'italic',
                      fontSize: 11.5,
                      color: LEGACY_COLOR.inkSoft,
                      marginBottom: 6,
                    }}
                  >
                    {subtitle}
                  </div>
                )}
                <Table style={legacyTableStyle}>
                  <TableHeader>
                    <TableRow>
                      <TableHead style={legacyTableHeadCellStyle}>Score</TableHead>
                      <TableHead style={legacyTableHeadCellStyle}>Status</TableHead>
                      <TableHead style={legacyTableHeadCellStyle} />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell style={legacyTableCellStyle}>
                        {Number(entry.finalPct).toFixed(3)}%
                      </TableCell>
                      <TableCell style={legacyTableCellStyle}>{entry.status}</TableCell>
                      <TableCell style={legacyTableCellStyle}>
                        <ScorecardLink entryId={entry.id} />
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

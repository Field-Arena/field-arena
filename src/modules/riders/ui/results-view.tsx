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
      <button
        type="button"
        style={{ ...legacyButtonGhostStyle, marginBottom: 14 }}
        onClick={onBack}
      >
        ← Back to My Schedule
      </button>

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
                <table style={legacyTableStyle}>
                  <thead>
                    <tr>
                      <th style={legacyTableHeadCellStyle}>Score</th>
                      <th style={legacyTableHeadCellStyle}>Status</th>
                      <th style={legacyTableHeadCellStyle} />
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td style={legacyTableCellStyle}>{Number(entry.finalPct).toFixed(3)}%</td>
                      <td style={legacyTableCellStyle}>{entry.status}</td>
                      <td style={legacyTableCellStyle}>
                        <ScorecardLink entryId={entry.id} />
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

import { ScorecardLink } from './scorecard-modal';
import {
  LEGACY_COLOR,
  LegacySecTitle,
  legacyButtonGhostStyle,
  legacyCardStyle,
  legacySecNoteStyle,
  legacyTableCellStyle,
  legacyTableHeadCellStyle,
  legacyTableStyle,
} from './legacy-theme';
import { classSubtitle } from '../utils';
import type { RiderEntryDetail } from '../types';

function classDisplayName(cls: { label: string; displayName: string | null }): string {
  return (cls.displayName?.trim() ?? '') || cls.label;
}

/**
 * The Results view — legacy's `#dtab-results` (rider.html lines 710-718).
 * Not a sidebar tab: reached only via the "🏆 View Results" button on the
 * Schedule tab, with "← Back to My Schedule" as its only way back — mirrors
 * `showDashTab('results')`'s exact mechanism (no `.dash-tab` has
 * `data-dtab="results"`, so no sidebar item highlights while this is open).
 * One outer card ("Results" / "Placings and ribbons for your classes, as
 * scores come in."), with one block per scored entry inside it — not a
 * separate card per entry.
 *
 * `#results-congrats` stays empty here, matching legacy's own real-mode
 * behavior: ribbon/placing congrats banners are demo-only in legacy (no
 * `place`/`fieldSize` field exists in any real API response), so there is no
 * real placing to show.
 */
export function ResultsView({ entries, onBack }: { entries: RiderEntryDetail[]; onBack: () => void }) {
  const completed = entries.filter((entry) => {
    if (entry.finalPct == null) return false;
    return !Number.isNaN(Number(entry.finalPct));
  });

  return (
    <div>
      <button type="button" style={{ ...legacyButtonGhostStyle, marginBottom: 14 }} onClick={onBack}>
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
                <div style={{ fontWeight: 700, color: LEGACY_COLOR.ink, marginBottom: subtitle ? 0 : 6 }}>
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

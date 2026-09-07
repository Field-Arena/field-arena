'use client';

import { useMemo, useState } from 'react';
import { ClassResultsBlock } from '@/modules/operations/ui/class-results-block';
import { ScoreCell } from '@/modules/operations/ui/score-cell';
import {
  bestScoreRows,
  disciplinesIn,
  BEST_SCORE_LIMIT,
} from '@/modules/operations/utils/best-score-rows';
import type { ScheduleClass, PastShowResult } from '@/modules/operations/types';

const LIVE = 'live';

/* Results tab — legacy showstaff-ops.html:1148 viewResults().
 *
 * Two modes behind one picker, exactly as legacy had it: the live show, or any
 * past show this person worked. Each mode leads with the top-10 leaderboard by
 * discipline, then the per-class placings.
 *
 * The discipline filter is applied BEFORE the top-10 slice, matching legacy
 * (:498) — picking a discipline gives you the best ten *within* it, not
 * whichever of a fixed overall ten happen to belong to it. */
export function ResultsBoard({
  liveShowName,
  liveClasses,
  pastShows,
}: {
  liveShowName: string;
  liveClasses: ScheduleClass[];
  pastShows: PastShowResult[];
}) {
  const [selected, setSelected] = useState<string>(LIVE);
  const [discipline, setDiscipline] = useState('all');

  const past = pastShows.find((s) => s.showId === selected) ?? null;
  const classes = past ? past.classes : liveClasses;

  const disciplines = useMemo(() => disciplinesIn(classes), [classes]);
  const best = useMemo(() => bestScoreRows(classes, discipline), [classes, discipline]);

  function pickShow(next: string) {
    setSelected(next);
    // Disciplines differ per show, so a filter carried across would silently
    // match nothing. Legacy reset it the same way (:1151).
    setDiscipline('all');
  }

  return (
    <div className="space-y-4">
      <div className="card">
        <label className="sf-label" htmlFor="ops-results-show">
          Show
        </label>
        <select
          id="ops-results-show"
          className="sel"
          value={selected}
          onChange={(e) => {
            pickShow(e.target.value);
          }}
        >
          <option value={LIVE}>{liveShowName} — live</option>
          {pastShows.map((s) => (
            <option key={s.showId} value={s.showId}>
              {s.showName}
              {s.date ? ` · ${s.date}` : ''}
            </option>
          ))}
        </select>
      </div>

      <p className="doc-note">
        {past
          ? `Past results — final placings from ${past.showName}. Complete and on record.`
          : 'Rankings update as each ride is scored — placings shift as riders move in and out of the top.'}
      </p>

      <div className="card">
        <h2>
          Top {BEST_SCORE_LIMIT} best scores {past ? '' : 'of the day '}— by discipline
        </h2>

        {disciplines.length > 1 && (
          <div className="mb-3 flex flex-wrap gap-2">
            {['all', ...disciplines].map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => {
                  setDiscipline(d);
                }}
                aria-pressed={discipline === d}
                className={`chip${discipline === d ? 'on' : ''}`}
              >
                {d === 'all' ? 'All' : d}
              </button>
            ))}
          </div>
        )}

        {best.length === 0 ? (
          <p className="muted">No scores posted yet.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Rank</th>
                <th>Rider</th>
                <th>Horse</th>
                <th>Discipline</th>
                <th className="r">Score</th>
              </tr>
            </thead>
            <tbody>
              {best.map((row, i) => (
                <tr
                  key={`${row.className}-${row.num}-${String(i)}`}
                  className={i === 0 ? 'lead' : undefined}
                >
                  <td>
                    <span className={`rank${i === 0 ? 'g' : ''}`}>{i + 1}</span>
                  </td>
                  <td>
                    #{row.num} {row.rider}
                  </td>
                  <td>{row.horse}</td>
                  <td>{row.discipline}</td>
                  <td className="r">
                    <ScoreCell
                      value={row.pctRaw ?? row.pct.toFixed(3)}
                      num={row.num}
                      rider={row.rider}
                      horse={row.horse}
                      className={row.className}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {classes.map((cls) => (
        <div className="card" key={cls.id}>
          <h2>{cls.label}</h2>
          <p className="sub">
            {[cls.ring, cls.date, cls.time].filter(Boolean).join(' · ') || 'Not scheduled'}
          </p>
          <ClassResultsBlock cls={cls} />
        </div>
      ))}
    </div>
  );
}

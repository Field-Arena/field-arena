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
import {
  CardTitle,
  Chip,
  ChipRow,
  EmptyState,
  FA_MUTED,
  FA_SELECT,
  FA_TABLE,
  FA_TABLE_WRAP,
  FA_TD,
  FA_TH,
  FA_THEAD_ROW,
  FA_TR,
  FaCard,
  SectionLabel,
  StatBox,
  StatGrid,
} from '@/shared/ui/organizer/fa-page';

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
  const counts = useMemo(
    () => ({
      done: classes.filter((c) => c.status === 'done').length,
      scored: classes.reduce((sum, c) => sum + c.scoredCount, 0),
    }),
    [classes],
  );

  function pickShow(next: string) {
    setSelected(next);
    // Disciplines differ per show, so a filter carried across would silently
    // match nothing. Legacy reset it the same way (:1151).
    setDiscipline('all');
  }

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <select
          id="ops-results-show"
          aria-label="Show"
          className={FA_SELECT}
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
        <p className={FA_MUTED}>
          {past
            ? `Past results — final placings from ${past.showName}. Complete and on record.`
            : 'Rankings update as each ride is scored — placings shift as riders move in and out of the top.'}
        </p>
      </div>

      <StatGrid cols={3}>
        <StatBox label="Classes" value={classes.length} />
        <StatBox label="Complete" value={counts.done} tone="green" note="final placings" />
        <StatBox label="Rides scored" value={counts.scored} />
      </StatGrid>

      <SectionLabel>
        Top {BEST_SCORE_LIMIT} best scores {past ? '' : 'of the day '}— by discipline
      </SectionLabel>

      {disciplines.length > 1 && (
        <ChipRow>
          {['all', ...disciplines].map((d) => (
            <Chip
              key={d}
              active={discipline === d}
              onClick={() => {
                setDiscipline(d);
              }}
            >
              {d === 'all' ? 'All' : d}
            </Chip>
          ))}
        </ChipRow>
      )}

      {best.length === 0 ? (
        <EmptyState title="No scores posted yet" />
      ) : (
        <div className={FA_TABLE_WRAP}>
          <table className={FA_TABLE}>
            <thead>
              <tr className={FA_THEAD_ROW}>
                <th className={FA_TH}>Rank</th>
                <th className={FA_TH}>Rider</th>
                <th className={FA_TH}>Horse</th>
                <th className={FA_TH}>Discipline</th>
                <th className={`${FA_TH} text-right`}>Score</th>
              </tr>
            </thead>
            <tbody>
              {best.map((row, i) => (
                <tr
                  key={`${row.className}-${row.num}-${String(i)}`}
                  className={`${FA_TR} ${i === 0 ? 'bg-[#F4FAF6]' : ''}`}
                >
                  <td className={FA_TD}>
                    <span
                      className={`inline-flex size-7 items-center justify-center rounded-full text-[13px] font-extrabold ${
                        i === 0 ? 'bg-[#1A5B3C] text-white' : 'bg-[#EDF0EE] text-[#0D2C23]'
                      }`}
                    >
                      {i + 1}
                    </span>
                  </td>
                  <td className={`${FA_TD} font-bold`}>
                    #{row.num} {row.rider}
                  </td>
                  <td className={FA_TD}>{row.horse}</td>
                  <td className={`${FA_TD} text-[#5A6B63]`}>{row.discipline}</td>
                  <td className={`${FA_TD} text-right font-bold`}>
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
        </div>
      )}

      {classes.length > 0 && <SectionLabel>Class by class</SectionLabel>}
      <div className="flex flex-col gap-3">
        {classes.map((cls) => (
          <FaCard key={cls.id} tone={cls.status === 'running' ? 'live' : 'default'}>
            <CardTitle>{cls.label}</CardTitle>
            <p className={`mt-0.5 ${FA_MUTED}`}>
              {[cls.ring, cls.date, cls.time].filter(Boolean).join(' · ') || 'Not scheduled'}
            </p>
            <ClassResultsBlock cls={cls} />
          </FaCard>
        ))}
      </div>
    </>
  );
}

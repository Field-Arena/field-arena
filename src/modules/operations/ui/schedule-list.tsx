'use client';
import { Fragment, useMemo, useState } from 'react';
import { formatShowDate } from '@/shared/lib/format/date';
import type { ScheduleClass } from '@/modules/operations/data/queries';
import { classStatusLabel } from '@/modules/operations/utils/class-status-label';
import { fmtTimeLabel } from '@/modules/operations/utils/fmt-time-label';
import { ClassResultsBlock } from '@/modules/operations/ui/class-results-block';
import { OpsSearch } from '@/modules/operations/ui/ops-search';
import {
  Chip,
  ChipRow,
  EmptyState,
  FA_MUTED,
  FA_TABLE,
  FA_TABLE_WRAP,
  FA_TD,
  FA_TH,
  FA_THEAD_ROW,
  FA_TR,
  Pill,
  SectionLabel,
  StatBox,
  StatGrid,
} from '@/shared/ui/organizer/fa-page';

const ALL = '__all__';

export function ScheduleList({ classes }: { classes: ScheduleClass[] }) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [ring, setRing] = useState(ALL);
  const [term, setTerm] = useState('');

  const rings = useMemo(() => {
    const map = new Map<string, number>();
    for (const c of classes) {
      const key = c.ring ?? '—';
      map.set(key, (map.get(key) ?? 0) + 1);
    }
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [classes]);

  const counts = useMemo(
    () => ({
      running: classes.filter((c) => c.status === 'running').length,
      done: classes.filter((c) => c.status === 'done').length,
      upcoming: classes.filter((c) => c.status === 'upcoming').length,
    }),
    [classes],
  );

  const days = useMemo(() => {
    const q = term.trim().toLowerCase();
    const map = new Map<string, ScheduleClass[]>();
    for (const c of classes) {
      if (ring !== ALL && (c.ring ?? '—') !== ring) continue;
      if (q && !c.label.toLowerCase().includes(q) && !(c.ring ?? '').toLowerCase().includes(q))
        continue;
      const key = c.date ?? 'unscheduled';
      const list = map.get(key) ?? [];
      list.push(c);
      map.set(key, list);
    }
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [classes, ring, term]);

  if (classes.length === 0) {
    return <EmptyState title="No classes yet" note="This show has no classes configured yet." />;
  }

  return (
    <>
      <StatGrid cols={4}>
        <StatBox label="Classes" value={classes.length} />
        <StatBox label="Running" value={counts.running} tone="green" note="scoring now" />
        <StatBox label="Complete" value={counts.done} />
        <StatBox label="Upcoming" value={counts.upcoming} />
      </StatGrid>

      <ChipRow>
        <Chip
          active={ring === ALL}
          onClick={() => {
            setRing(ALL);
          }}
        >
          All rings ({classes.length})
        </Chip>
        {rings.length > 1 &&
          rings.map(([name, n]) => (
            <Chip
              key={name}
              active={ring === name}
              onClick={() => {
                setRing(name);
              }}
            >
              {name} ({n})
            </Chip>
          ))}
        <OpsSearch
          value={term}
          onChange={setTerm}
          placeholder="Class or ring"
          label="Search classes"
        />
      </ChipRow>

      <p className={FA_MUTED}>
        Tap any class to see its results. Live classes show live results; upcoming classes show the
        draw order.
      </p>

      {days.length === 0 && (
        <div className="mt-4">
          <EmptyState title="No classes match" />
        </div>
      )}

      {days.map(([date, dayClasses]) => (
        <div key={date}>
          <SectionLabel>
            {date === 'unscheduled' ? 'Unscheduled' : formatShowDate(date)}
          </SectionLabel>
          <div className={FA_TABLE_WRAP}>
            <table className={FA_TABLE}>
              <thead>
                <tr className={FA_THEAD_ROW}>
                  <th className={`${FA_TH} w-8`}>
                    <span className="sr-only">Expand</span>
                  </th>
                  <th className={FA_TH}>Time</th>
                  <th className={FA_TH}>Ring</th>
                  <th className={FA_TH}>Class</th>
                  <th className={`${FA_TH} text-right`}>Entries</th>
                  <th className={`${FA_TH} text-right`}>Status</th>
                </tr>
              </thead>
              <tbody>
                {dayClasses.map((c) => (
                  <Fragment key={c.id}>
                    <tr
                      onClick={() => {
                        setExpanded((e) => ({ ...e, [c.id]: !e[c.id] }));
                      }}
                      aria-expanded={!!expanded[c.id]}
                      className={`${FA_TR} cursor-pointer hover:bg-[#FBFCFB]`}
                    >
                      <td className={`${FA_TD} text-[#5A6B63]`}>{expanded[c.id] ? '▾' : '▸'}</td>
                      <td className={`${FA_TD} font-semibold whitespace-nowrap`}>
                        {fmtTimeLabel(c.time)}
                      </td>
                      <td className={`${FA_TD} text-[#5A6B63]`}>{c.ring ?? '—'}</td>
                      <td className={`${FA_TD} font-bold`}>{c.label}</td>
                      <td className={`${FA_TD} text-right`}>{c.entryCount}</td>
                      <td className={`${FA_TD} text-right`}>
                        <Pill
                          tone={
                            c.status === 'running' ? 'green' : c.status === 'done' ? 'blue' : 'grey'
                          }
                          live={c.status === 'running'}
                        >
                          {classStatusLabel(c.status)}
                        </Pill>
                      </td>
                    </tr>
                    {expanded[c.id] && (
                      <tr className="bg-[#FBFCFB]">
                        <td colSpan={6} className="px-4 py-2">
                          <ClassResultsBlock cls={c} />
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </>
  );
}

'use client';
import { Fragment, useMemo, useState } from 'react';
import { formatShowDate } from '@/shared/lib/format/date';
import { StatusBadge, type StatusTone } from '@/shared/ui/status-badge';
import { EmptyPanel } from '@/modules/staff/ui/workspace-page';
import type { ScheduleClass } from '@/modules/operations/data/queries';
import { classStatusLabel } from '@/modules/operations/utils/class-status-label';
import { fmtTimeLabel } from '@/modules/operations/utils/fmt-time-label';
import { ClassResultsBlock } from '@/modules/operations/ui/class-results-block';

export function ScheduleList({ classes }: { classes: ScheduleClass[] }) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const days = useMemo(() => {
    const map = new Map<string, ScheduleClass[]>();
    for (const c of classes) {
      const key = c.date ?? 'unscheduled';
      const list = map.get(key) ?? [];
      list.push(c);
      map.set(key, list);
    }
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [classes]);

  if (classes.length === 0) {
    return <EmptyPanel title="No classes yet" note="This show has no classes configured yet." />;
  }

  return (
    <div>
      {days.map(([date, dayClasses]) => (
        <div key={date} style={{ marginBottom: 22 }}>
          <h2 className="show-detail-title">
            {date === 'unscheduled' ? 'Unscheduled' : formatShowDate(date)}
          </h2>
          <div style={{ overflowX: 'auto' }}>
            <table>
              <thead>
                <tr>
                  <th></th>
                  <th>Time</th>
                  <th>Ring</th>
                  <th>Class</th>
                  <th className="r">Entries</th>
                  <th className="r">Status</th>
                </tr>
              </thead>
              <tbody>
                {dayClasses.map((c) => (
                  <Fragment key={c.id}>
                    <tr
                      onClick={() => {
                        setExpanded((e) => ({ ...e, [c.id]: !e[c.id] }));
                      }}
                      style={{ cursor: 'pointer' }}
                    >
                      <td style={{ color: 'var(--fa-muted)', width: 20 }}>
                        {expanded[c.id] ? '▾' : '▸'}
                      </td>
                      <td>{fmtTimeLabel(c.time)}</td>
                      <td>{c.ring ?? '—'}</td>
                      <td>{c.label}</td>
                      <td className="r">{c.entryCount}</td>
                      <td className="r">
                        <StatusBadge tone={statusTone(c.status)}>
                          {classStatusLabel(c.status)}
                        </StatusBadge>
                      </td>
                    </tr>
                    {expanded[c.id] && (
                      <tr>
                        <td colSpan={6} style={{ background: 'var(--cream)' }}>
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
    </div>
  );
}

function statusTone(status: ScheduleClass['status']): StatusTone {
  if (status === 'done') return 'success';
  if (status === 'running') return 'warn';
  return 'neutral';
}

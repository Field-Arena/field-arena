'use client';
import { Fragment, useMemo, useState } from 'react';
import { formatShowDate } from '@/shared/lib/format/date';
import { StatusBadge, type StatusTone } from '@/shared/ui/status-badge';
import { EmptyPanel } from '@/modules/staff/ui/workspace-page';
import type { ScheduleClass, ScheduleEntry } from '../data/queries';
import { classStatusLabel, fmtTimeLabel } from '../utils';

/**
 * The Schedule tab, ported from viewSchedule()/classResultsBlock(). Grouped
 * by day, one expandable row per class — clicking a row reveals its
 * placings (once anything is scored) and its full ride order, same as
 * legacy's toggleSched().
 */
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
          <h2 className="show-detail-title">{date === 'unscheduled' ? 'Unscheduled' : formatShowDate(date)}</h2>
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
                      <td style={{ color: 'var(--fa-muted)', width: 20 }}>{expanded[c.id] ? '▾' : '▸'}</td>
                      <td>{fmtTimeLabel(c.time)}</td>
                      <td>{c.ring ?? '—'}</td>
                      <td>{c.label}</td>
                      <td className="r">{c.entryCount}</td>
                      <td className="r">
                        <StatusBadge tone={statusTone(c.status)}>{classStatusLabel(c.status)}</StatusBadge>
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

/** Ported from showstaff-ops.html's RIBBONS/ribbon()/ribBorder() — colors for 1st through 8th place. */
const RIBBONS: { bg: string; fg: string; name: string }[] = [
  { bg: '#1E5AA8', fg: '#ffffff', name: 'Blue' },
  { bg: '#C0392B', fg: '#ffffff', name: 'Red' },
  { bg: '#E4B21E', fg: '#3a2f00', name: 'Yellow' },
  { bg: '#FFFFFF', fg: '#22271F', name: 'White' },
  { bg: '#E58FB0', fg: '#4a1f30', name: 'Pink' },
  { bg: '#2E7D46', fg: '#ffffff', name: 'Green' },
  { bg: '#6B4E9E', fg: '#ffffff', name: 'Purple' },
  { bg: '#7A5230', fg: '#ffffff', name: 'Brown' },
];

function RibbonSwatch({ place }: { place: number }) {
  if (place > RIBBONS.length) return null;
  const rb = RIBBONS[place - 1];
  if (!rb) return null;
  return (
    <span
      title={`${rb.name} · ${String(place)}`}
      style={{
        display: 'inline-block',
        width: 10,
        height: 10,
        borderRadius: '50%',
        background: rb.bg,
        border: rb.bg === '#FFFFFF' ? '1px solid #CBB37A' : '1px solid transparent',
        marginRight: 6,
        verticalAlign: 'middle',
      }}
    />
  );
}

function ClassResultsBlock({ cls }: { cls: ScheduleClass }) {
  return (
    <div style={{ padding: '10px 4px 14px' }}>
      <p style={{ color: 'var(--fa-muted)', margin: '2px 0 10px', fontSize: 13 }}>
        {cls.status === 'upcoming'
          ? `Not started yet — ${String(cls.entryCount)} entered. Draw order below.`
          : cls.status === 'running'
            ? `Live — ${String(cls.scoredCount)} of ${String(cls.entryCount)} scored.`
            : 'Final results.'}
      </p>

      {cls.placings.length > 0 && (
        <>
          <h3 style={{ fontFamily: 'var(--serif)', fontSize: 14, color: 'var(--hunter-deep)', margin: '0 0 6px' }}>
            Placings
          </h3>
          <table>
            <thead>
              <tr>
                <th>Place</th>
                <th>Rider</th>
                <th>Horse</th>
                <th className="r">Score</th>
              </tr>
            </thead>
            <tbody>
              {cls.placings.map((p) => (
                <tr key={p.num}>
                  <td>
                    <RibbonSwatch place={p.place} />
                    {p.place}
                  </td>
                  <td>
                    #{p.num} · {p.rider}
                  </td>
                  <td>{p.horse}</td>
                  <td className="r">
                    <span className="pct">{p.finalPctRaw}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      <h3
        style={{
          fontFamily: 'var(--serif)',
          fontSize: 14,
          color: 'var(--hunter-deep)',
          margin: cls.placings.length > 0 ? '14px 0 6px' : '0 0 6px',
        }}
      >
        Scores in order of ride
      </h3>
      <RideOrderTable entries={cls.entries} />
    </div>
  );
}

function RideOrderTable({ entries }: { entries: ScheduleEntry[] }) {
  if (entries.length === 0) return <p style={{ color: 'var(--fa-muted)', fontSize: 13 }}>No entries.</p>;
  return (
    <table>
      <thead>
        <tr>
          <th>Draw</th>
          <th>Rider</th>
          <th>Horse</th>
          <th className="r">Score</th>
        </tr>
      </thead>
      <tbody>
        {entries.map((e) => (
          <tr key={e.num}>
            <td>{e.draw}</td>
            <td>
              #{e.num} · {e.rider}
            </td>
            <td>{e.horse}</td>
            <td className="r">
              {e.finalPctRaw != null ? (
                <span className="pct">{e.finalPctRaw}</span>
              ) : (
                <span style={{ color: 'var(--fa-muted)' }}>To ride</span>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

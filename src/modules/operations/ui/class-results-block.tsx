import type { ScheduleClass } from '@/modules/operations/data/queries';
import { RibbonSwatch } from '@/modules/operations/ui/ribbon-swatch';
import { RideOrderTable } from '@/modules/operations/ui/ride-order-table';

export function ClassResultsBlock({ cls }: { cls: ScheduleClass }) {
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
          <h3
            style={{
              fontFamily: 'var(--serif)',
              fontSize: 14,
              color: 'var(--hunter-deep)',
              margin: '0 0 6px',
            }}
          >
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

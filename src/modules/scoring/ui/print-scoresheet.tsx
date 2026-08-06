import { formatTimestamp } from '@/shared/lib/format/date';
import type { RideEntry, ScoreRow, TestDefinition } from '../types';

/**
 * The printable paper test sheet, ported from showrunner-scoring.html's
 * hidden `#print-card`. Reuses the same `[data-print-report]` /
 * `hidden print:block` mechanism the Awards screen already established
 * (`awards-screen.tsx`) — the app's global print stylesheet only shows
 * content marked this way, so a scoring page carries its own copy rather
 * than duplicating that stylesheet rule.
 */
export function PrintScoresheet({
  className,
  entry,
  test,
  score,
}: {
  className: string;
  entry: RideEntry;
  test: TestDefinition;
  score: ScoreRow | undefined;
}) {
  return (
    <div data-print-report className="hidden print:block">
      <h1 className="mb-1 text-xl font-semibold">{className}</h1>
      <p className="mb-4 text-sm">
        {test.name} · #{entry.num} {entry.rider ?? ''} {entry.horse ? `· ${entry.horse}` : ''}
      </p>

      <table className="w-full border-collapse text-sm">
        <thead>
          <tr>
            <th className="border p-1 text-left">#</th>
            <th className="border p-1 text-left">Movement</th>
            <th className="border p-1 text-left">Mark</th>
            <th className="border p-1 text-left">Remark</th>
          </tr>
        </thead>
        <tbody>
          {test.movements.map((m) => (
            <tr key={m.num}>
              <td className="border p-1">{m.num}</td>
              <td className="border p-1">{m.text}</td>
              <td className="border p-1">{score?.movements[String(m.num)]?.value ?? '—'}</td>
              <td className="border p-1">{score?.remarks[String(m.num)] ?? ''}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {test.collectives.length > 0 && (
        <table className="mt-4 w-full border-collapse text-sm">
          <thead>
            <tr>
              <th className="border p-1 text-left">Collective</th>
              <th className="border p-1 text-left">Mark</th>
            </tr>
          </thead>
          <tbody>
            {test.collectives.map((c) => (
              <tr key={c.key}>
                <td className="border p-1">{c.label}</td>
                <td className="border p-1">{score?.collectives[c.key]?.value ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <p className="mt-4 text-sm">Errors of course: {score?.errors ?? 0}</p>
      <p className="mt-2 text-sm whitespace-pre-wrap">Final remarks: {score?.finalRemarks ?? ''}</p>

      <p className="mt-8 text-sm">
        {score?.signedAt ? (
          <>
            Signed by {score.signedBy} — {formatTimestamp(score.signedAt)}
          </>
        ) : (
          'Signature: _______________________  Date: _______________'
        )}
      </p>
    </div>
  );
}

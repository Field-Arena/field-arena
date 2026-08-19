import { formatTimestamp } from '@/shared/lib/format/date';
import { errorDeduction, scoreLabel, sheetPct } from '@/modules/scoring/scoring-engine';
import { toSheet } from '@/modules/scoring/utils/to-sheet';
import type { RideEntry, ScoreRow, TestDefinition } from '@/modules/scoring/types';

/** "2 pts" / "0.5%" / "Elimination" / "0 pts" — matches legacy's `dedText`. */
function deductionText(errors: number, test: TestDefinition): string {
  const ded = errorDeduction(errors, test);
  if (ded === 'ELIM') return 'Elimination';
  return ded.amount ? `${String(ded.amount)}${ded.mode === 'pct' ? '%' : ' pts'}` : '0 pts';
}

/**
 * The printable paper test sheet, ported from showrunner-scoring.html's
 * hidden `#print-card`. Reuses the same `[data-print-report]` /
 * `hidden print:block` mechanism the Awards screen already established
 * (`awards-screen.tsx`) — the app's global print stylesheet only shows
 * content marked this way, so a scoring page carries its own copy rather
 * than duplicating that stylesheet rule.
 */
export function PrintScoresheet({
  showName,
  className,
  entry,
  test,
  score,
  judgeName,
  judgePosition,
}: {
  showName: string;
  className: string;
  entry: RideEntry;
  test: TestDefinition;
  score: ScoreRow | undefined;
  judgeName: string;
  judgePosition: string | null;
}) {
  const errors = score?.errors ?? 0;
  const pct = score ? sheetPct(toSheet(score), test) : null;

  return (
    <div data-print-report className="hidden print:block">
      <h1 className="mb-1 text-xl font-semibold">Field &amp; Arena</h1>
      {showName && <p className="text-sm font-semibold">{showName}</p>}
      <p className="mb-4 text-sm">
        {test.name}
        {className ? ` · ${className}` : ''}
      </p>
      <p className="mb-1 text-sm">
        <strong>Judge:</strong> {judgeName} at {judgePosition ?? '—'}
      </p>
      <p className="mb-4 text-sm">
        <strong>Rider:</strong> #{entry.num} {entry.rider ?? ''}
        <br />
        <strong>Horse:</strong> {entry.horse ?? ''}
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

      <p className="mt-4 text-sm">
        Errors of course: {errors} ({deductionText(errors, test)}) · Final score:{' '}
        {pct !== null ? scoreLabel(pct) : '—'}
      </p>
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

'use client';

import { useRiderScorecard } from '@/modules/riders/hooks/use-rider-scorecard';
import {
  LEGACY_COLOR,
  LEGACY_GEORGIA,
  legacyTableCellStyle,
  legacyTableHeadCellStyle,
  legacyTableStyle,
} from '@/modules/riders/ui/legacy-theme';
import type { RiderScorecard, RiderScorecardCard } from '@/modules/riders/types';
import { formatTimestamp } from '@/shared/lib/format/date';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/shared/ui/shadcn/dialog';

export function ScorecardLink({ entryId }: { entryId: string }) {
  const { state, load, reset } = useRiderScorecard();

  return (
    <Dialog
      onOpenChange={(open) => {
        if (open) void load(entryId);
        else reset();
      }}
    >
      <DialogTrigger asChild>
        <button
          type="button"
          style={{
            background: 'none',
            border: 'none',
            padding: 0,
            fontSize: 12.5,
            color: LEGACY_COLOR.hunterDeep,
            textDecoration: 'underline',
            cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          View scorecard ↗
        </button>
      </DialogTrigger>
      <DialogContent
        className="max-h-[85vh] max-w-2xl overflow-y-auto"
        style={{
          background: LEGACY_COLOR.cream,
          border: `1px solid ${LEGACY_COLOR.border}`,
          color: LEGACY_COLOR.ink,
        }}
      >
        <DialogHeader>
          <DialogTitle style={{ fontFamily: LEGACY_GEORGIA, color: LEGACY_COLOR.hunterDeep }}>
            Scorecard
          </DialogTitle>
        </DialogHeader>
        {state.status === 'loading' && (
          <p style={{ fontSize: 13.5, color: LEGACY_COLOR.inkSoft }}>Loading…</p>
        )}
        {state.status === 'error' && (
          <p style={{ fontSize: 13.5, color: LEGACY_COLOR.inkSoft }}>
            Couldn&apos;t load your scorecard. Please try again.
          </p>
        )}
        {state.status === 'loaded' && <ScorecardBody scorecard={state.scorecard} />}
      </DialogContent>
    </Dialog>
  );
}

function ScorecardBody({ scorecard }: { scorecard: RiderScorecard }) {
  if (scorecard.cards.length === 0) {
    return (
      <p style={{ fontSize: 13.5, color: LEGACY_COLOR.inkSoft }}>
        Your scorecard isn&apos;t ready yet — it appears here once the judge signs it.
      </p>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ fontSize: 13.5, color: LEGACY_COLOR.inkSoft }}>
        {scorecard.showName} · {scorecard.testName}
      </div>
      <div style={{ fontSize: 13.5, color: LEGACY_COLOR.ink }}>
        <strong>Rider:</strong> #{scorecard.num} {scorecard.rider ?? ''}
        <br />
        <strong>Horse:</strong> {scorecard.horse ?? ''}
      </div>
      {scorecard.cards.map((card, index) => (
        <div
          key={`${card.judgeName ?? 'judge'}-${String(index)}`}
          style={
            index > 0
              ? {
                  borderTop: `1px dashed ${LEGACY_COLOR.border}`,
                  paddingTop: 20,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10,
                }
              : { display: 'flex', flexDirection: 'column', gap: 10 }
          }
        >
          <ScorecardCardView card={card} />
        </div>
      ))}
    </div>
  );
}

function ScorecardCardView({ card }: { card: RiderScorecardCard }) {
  return (
    <>
      <p style={{ fontSize: 13.5, color: LEGACY_COLOR.ink }}>
        <strong>Judge:</strong> {card.judgeName ?? '—'} at {card.position ?? '—'}
      </p>

      <table style={legacyTableStyle}>
        <thead>
          <tr>
            <th style={legacyTableHeadCellStyle}>#</th>
            <th style={legacyTableHeadCellStyle}>Movement</th>
            <th style={legacyTableHeadCellStyle}>Score</th>
            <th style={legacyTableHeadCellStyle}>Remark</th>
          </tr>
        </thead>
        <tbody>
          {card.movements.map((movement) => (
            <tr key={movement.num}>
              <td style={legacyTableCellStyle}>{movement.num}</td>
              <td style={legacyTableCellStyle}>
                {movement.text}
                {movement.coef > 1 ? ` (×${String(movement.coef)})` : ''}
              </td>
              <td style={legacyTableCellStyle}>{movement.value ?? '—'}</td>
              <td style={legacyTableCellStyle}>{movement.remark}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {card.collectives.length > 0 && (
        <table style={legacyTableStyle}>
          <thead>
            <tr>
              <th style={legacyTableHeadCellStyle}>Collective</th>
              <th style={legacyTableHeadCellStyle}>Score</th>
            </tr>
          </thead>
          <tbody>
            {card.collectives.map((collective) => (
              <tr key={collective.key}>
                <td style={legacyTableCellStyle}>{collective.label}</td>
                <td style={legacyTableCellStyle}>{collective.value ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {card.finalRemarks && (
        <p style={{ fontSize: 13.5, whiteSpace: 'pre-wrap', color: LEGACY_COLOR.ink }}>
          Final remarks: {card.finalRemarks}
        </p>
      )}
      <p style={{ fontSize: 13.5, color: LEGACY_COLOR.ink }}>Errors of course: {card.errors}</p>
      <p style={{ fontSize: 13.5, color: LEGACY_COLOR.inkSoft }}>
        {card.signedAt
          ? `Signed by ${card.signedBy ?? ''} — ${formatTimestamp(card.signedAt)}`
          : 'Not yet signed'}
      </p>
    </>
  );
}

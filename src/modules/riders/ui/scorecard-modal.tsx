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
import { Button } from '@/shared/ui/shadcn/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/shared/ui/shadcn/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/ui/shadcn/table';

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
        <Button
          type="button"
          variant="link"
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
        </Button>
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

      <Table style={legacyTableStyle}>
        <TableHeader>
          <TableRow>
            <TableHead style={legacyTableHeadCellStyle}>#</TableHead>
            <TableHead style={legacyTableHeadCellStyle}>Movement</TableHead>
            <TableHead style={legacyTableHeadCellStyle}>Score</TableHead>
            <TableHead style={legacyTableHeadCellStyle}>Remark</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {card.movements.map((movement) => (
            <TableRow key={movement.num}>
              <TableCell style={legacyTableCellStyle}>{movement.num}</TableCell>
              <TableCell style={legacyTableCellStyle}>
                {movement.text}
                {movement.coef > 1 ? ` (×${String(movement.coef)})` : ''}
              </TableCell>
              <TableCell style={legacyTableCellStyle}>{movement.value ?? '—'}</TableCell>
              <TableCell style={legacyTableCellStyle}>{movement.remark}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {card.collectives.length > 0 && (
        <Table style={legacyTableStyle}>
          <TableHeader>
            <TableRow>
              <TableHead style={legacyTableHeadCellStyle}>Collective</TableHead>
              <TableHead style={legacyTableHeadCellStyle}>Score</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {card.collectives.map((collective) => (
              <TableRow key={collective.key}>
                <TableCell style={legacyTableCellStyle}>{collective.label}</TableCell>
                <TableCell style={legacyTableCellStyle}>{collective.value ?? '—'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
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

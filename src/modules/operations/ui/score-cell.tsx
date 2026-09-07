'use client';

import { ScoreDetailDialog } from '@/modules/operations/ui/score-detail-dialog';

/* Legacy scoreLink (showstaff-ops.html:694): a score is only clickable when the
 * class it belongs to is known — `if(!cls) return '<span class="pct">…'`. Same
 * rule here, so a score with no class context stays inert rather than opening a
 * dialog that cannot say what was ridden. */
export function ScoreCell({
  value,
  num,
  rider,
  horse,
  className: classLabel,
}: {
  value: string | null;
  num: string;
  rider: string;
  horse: string;
  className: string | null;
}) {
  if (value == null) return null;
  if (!classLabel) return <span className="pct">{value}</span>;

  return (
    <ScoreDetailDialog num={num} rider={rider} horse={horse} className={classLabel} pct={value}>
      {value}
    </ScoreDetailDialog>
  );
}

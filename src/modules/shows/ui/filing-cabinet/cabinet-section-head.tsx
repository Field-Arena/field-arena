import type { ReactNode } from 'react';
import { CardTitle, FA_MUTED } from '@/shared/ui/organizer/fa-page';

/* Heading for one drawer of the filing cabinet, under the Documents page
 * header and its section chips. */
export function CabinetSectionHead({
  title,
  lede,
  actions,
  className,
}: {
  title: ReactNode;
  lede: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <div className={`mb-3 flex flex-wrap items-end justify-between gap-3 ${className ?? ''}`}>
      <div className="max-w-[760px] min-w-0">
        <CardTitle>{title}</CardTitle>
        <p className={`${FA_MUTED} mt-0.5 leading-[1.5]`}>{lede}</p>
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

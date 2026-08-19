import { DISCIPLINE_MARQUEE } from '@/modules/marketing/landing-content';

const DISPLAY = 'font-[family-name:var(--font-nr)]';

function MarqueeRow({ ariaHidden = false }: { ariaHidden?: boolean }) {
  return (
    <div className="flex items-center gap-11 pr-11" aria-hidden={ariaHidden || undefined}>
      {DISCIPLINE_MARQUEE.map((item) => (
        <span key={item} className="flex items-center gap-11">
          <span className={`whitespace-nowrap ${DISPLAY} text-ink-deep text-[21px]`}>{item}</span>
          <span aria-hidden className="bg-gold size-[5px] rounded-full" />
        </span>
      ))}
    </div>
  );
}

export function DisciplineMarquee() {
  return (
    <div className="border-line-mint bg-mint overflow-hidden border-y py-[22px]">
      <div className="fa-motion flex w-max [animation:fa-marquee_44s_linear_infinite]">
        <MarqueeRow />
        <MarqueeRow ariaHidden />
      </div>
    </div>
  );
}

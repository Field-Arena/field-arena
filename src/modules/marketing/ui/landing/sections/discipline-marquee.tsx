import { DISCIPLINE_MARQUEE } from '@/modules/marketing/landing-content';

const DISPLAY = 'font-[family-name:var(--font-nr)]';

function MarqueeRow({ ariaHidden = false }: { ariaHidden?: boolean }) {
  return (
    <div className="flex items-center gap-11 pr-11" aria-hidden={ariaHidden || undefined}>
      {DISCIPLINE_MARQUEE.map((item) => (
        <span key={item} className="flex items-center gap-11">
          <span className={`whitespace-nowrap ${DISPLAY} text-[21px] text-ink-deep`}>{item}</span>
          <span aria-hidden className="size-[5px] rounded-full bg-gold" />
        </span>
      ))}
    </div>
  );
}

export function DisciplineMarquee() {
  return (
    <div className="overflow-hidden border-y border-line-mint bg-mint py-[22px]">
      {/* Two identical copies sliding 0 → -50%: the second sits exactly where
          the first started when the loop restarts, which is what hides the seam. */}
      <div className="fa-motion flex w-max [animation:fa-marquee_44s_linear_infinite]">
        <MarqueeRow />
        <MarqueeRow ariaHidden />
      </div>
    </div>
  );
}

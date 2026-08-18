/** The two-step progress marker shown above the sign-up form. */
export function StepMarker({ current }: { current: 1 | 2 }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="grid size-5 place-items-center rounded-full bg-forest text-[9.5px] font-bold text-gold">
        1
      </span>
      <span className="text-[10.5px] font-bold uppercase tracking-[.16em] text-forest">
        Account
      </span>
      <span aria-hidden className="mx-1 h-px w-[26px] bg-line-mint-2" />
      <span
        className={`grid size-5 place-items-center rounded-full border border-line-mint-2 text-[9.5px] font-bold ${
          current === 2 ? 'bg-forest text-gold' : 'bg-paper text-fa-muted-2'
        }`}
      >
        2
      </span>
      <span
        className={`text-[10.5px] font-bold uppercase tracking-[.16em] ${
          current === 2 ? 'text-forest' : 'text-fa-muted-2'
        }`}
      >
        Verify
      </span>
    </div>
  );
}

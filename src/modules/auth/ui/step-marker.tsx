export function StepMarker({ current }: { current: 1 | 2 }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="bg-forest text-gold grid size-5 place-items-center rounded-full text-[9.5px] font-bold">
        1
      </span>
      <span className="text-forest text-[10.5px] font-bold tracking-[.16em] uppercase">
        Account
      </span>
      <span aria-hidden className="bg-line-mint-2 mx-1 h-px w-[26px]" />
      <span
        className={`border-line-mint-2 grid size-5 place-items-center rounded-full border text-[9.5px] font-bold ${
          current === 2 ? 'bg-forest text-gold' : 'bg-paper text-fa-muted-2'
        }`}
      >
        2
      </span>
      <span
        className={`text-[10.5px] font-bold tracking-[.16em] uppercase ${
          current === 2 ? 'text-forest' : 'text-fa-muted-2'
        }`}
      >
        Verify
      </span>
    </div>
  );
}

export type EventSalesViewMode = 'customer' | 'product' | 'rider';

const TABS: { mode: EventSalesViewMode; label: string }[] = [
  { mode: 'customer', label: 'By Customer' },
  { mode: 'product', label: 'By Product' },
  { mode: 'rider', label: 'By Rider' },
];

export function EventSalesViewTabs({
  mode,
  onChange,
}: {
  mode: EventSalesViewMode;
  onChange: (mode: EventSalesViewMode) => void;
}) {
  return (
    <div className="mb-3 flex flex-wrap items-center gap-2">
      {TABS.map((tab) => (
        <button
          key={tab.mode}
          type="button"
          onClick={() => {
            onChange(tab.mode);
          }}
          className={
            tab.mode === mode
              ? 'rounded-[9px] bg-[#0D2C23] px-4 py-2 text-[13px] font-bold text-white'
              : 'rounded-[9px] border border-[#D9E1DD] bg-white px-4 py-2 text-[13px] font-semibold text-[#5A6B63] transition-colors hover:border-[#0D2C23]'
          }
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

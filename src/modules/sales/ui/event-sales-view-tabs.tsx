const NOT_BUILT_TIP = 'Not built yet — coming in a later update';
const DISABLED_TABS = ['By Product', 'By Rider'] as const;

export function EventSalesViewTabs() {
  return (
    <div className="mb-3 flex flex-wrap items-center gap-2">
      <span className="rounded-[9px] bg-[#0D2C23] px-4 py-2 text-[13px] font-bold text-white">
        By Customer
      </span>
      {DISABLED_TABS.map((label) => (
        <span
          key={label}
          title={NOT_BUILT_TIP}
          className="cursor-not-allowed rounded-[9px] border border-[#D9E1DD] bg-white px-4 py-2 text-[13px] font-semibold text-[#B7C0BB]"
        >
          {label}
        </span>
      ))}
    </div>
  );
}

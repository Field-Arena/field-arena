export type EventSalesViewMode = 'customer' | 'product' | 'rider';

const TABS: { mode: EventSalesViewMode; label: string }[] = [
  { mode: 'customer', label: 'By customer' },
  { mode: 'product', label: 'By product' },
  { mode: 'rider', label: 'By rider' },
];

export function EventSalesViewTabs({
  mode,
  onChange,
}: {
  mode: EventSalesViewMode;
  onChange: (mode: EventSalesViewMode) => void;
}) {
  return (
    <div className="fa-subtoggle !mb-4">
      {TABS.map((tab) => (
        <button
          key={tab.mode}
          type="button"
          onClick={() => {
            onChange(tab.mode);
          }}
          className={tab.mode === mode ? 'fa-active' : undefined}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

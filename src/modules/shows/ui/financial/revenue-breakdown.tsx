import { formatMoneyExact } from '@/shared/lib/format/currency';
import type { ShowPnl } from '@/modules/shows/types';

export function RevenueBreakdown({ pnl }: { pnl: ShowPnl }) {
  if (pnl.categories.length === 0) {
    return (
      <p className="text-[12.5px] text-[#8A94A3]">No paid sales recorded yet for this show.</p>
    );
  }

  return (
    <>
      <p className="mb-3 text-[12.5px] text-[#8A94A3]">
        Every paid line item for this show, grouped by category and subcategory.
      </p>

      <div className="flex flex-col gap-4">
        {pnl.categories.map((category) => (
          <div key={category.name}>
            <div className="flex items-center justify-between border-b border-[#E7EAEE] pb-1.5 text-[13px] font-bold text-[#101828]">
              <span>{category.name}</span>
              <span>{formatMoneyExact(category.subtotal)}</span>
            </div>

            {category.subs.map((sub) => {
              const showSubHeader = !(category.subs.length === 1 && sub.name === category.name);

              return (
                <div key={sub.name} className="mt-2">
                  {showSubHeader && (
                    <div className="flex items-center justify-between text-[12.5px] font-semibold text-[#475467]">
                      <span>{sub.name}</span>
                      <span>{formatMoneyExact(sub.subtotal)}</span>
                    </div>
                  )}
                  <div className="mt-1 flex flex-col gap-0.5">
                    {sub.items.map((item) => (
                      <div
                        key={item.label}
                        className="flex items-center justify-between gap-2 text-[12.5px] text-[#475467]"
                      >
                        <span className="min-w-0 truncate">{item.label}</span>
                        <span className="flex flex-none items-center gap-2">
                          <span className="text-[11.5px] text-[#8A94A3]">×{item.qty}</span>
                          <span className="font-semibold text-[#101828]">
                            {formatMoneyExact(item.revenue)}
                          </span>
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-[#E7EAEE] pt-2.5 text-[13.5px] font-bold text-[#101828]">
        <span>Total revenue</span>
        <span>{formatMoneyExact(pnl.breakdownTotal)}</span>
      </div>

      {Math.round(pnl.breakdownTotal * 100) !== Math.round(pnl.revenueTotal * 100) && (
        <p className="mt-1.5 text-[11.5px] text-[#8A94A3]">
          Collected {formatMoneyExact(pnl.revenueTotal)} — the difference is discounts, comps or
          catalog prices that changed after the sale.
        </p>
      )}
    </>
  );
}

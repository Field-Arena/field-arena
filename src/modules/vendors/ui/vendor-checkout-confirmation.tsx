import { formatMoney } from '@/shared/lib/format/currency';
import { CardTitle, FA_MUTED, FaCard } from '@/shared/ui/organizer/fa-page';
import type { FinalizeVendorBookingResult } from '@/modules/vendors/types';

export function VendorCheckoutConfirmation({ result }: { result: FinalizeVendorBookingResult }) {
  return (
    <FaCard tone="live" className="max-w-[560px]">
      <CardTitle>{result.alreadyFulfilled ? 'Already confirmed' : 'Payment confirmed'}</CardTitle>

      <ul className="mt-3 list-none p-0 text-[14px] leading-[1.8]">
        {result.items.map((item, index) => (
          <li className="flex justify-between gap-3" key={`${item.label}-${String(index)}`}>
            <span>
              {item.label}
              {item.qty > 1 && ` × ${String(item.qty)}`}
            </span>
            <span>{formatMoney(item.amount)}</span>
          </li>
        ))}
      </ul>
      <div className="mt-2 flex justify-between gap-3 border-t border-[#EDF0EE] pt-3 text-[16px] font-bold text-[#0D2C23]">
        <span>Total charged</span>
        <span>{formatMoney(result.total)}</span>
      </div>

      <p className={`${FA_MUTED} mt-3`}>A receipt has been emailed to you.</p>
    </FaCard>
  );
}

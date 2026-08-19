import { formatMoney } from '@/shared/lib/format/currency';
import type { FinalizeVendorBookingResult } from '@/modules/vendors/types';

export function VendorCheckoutConfirmation({ result }: { result: FinalizeVendorBookingResult }) {
  return (
    <div className="dash-card">
      <h2 className="show-detail-title">
        {result.alreadyFulfilled ? 'Already confirmed' : 'Payment confirmed'}
      </h2>

      <div className="b-items" style={{ marginTop: 10 }}>
        {result.items.map((item, index) => (
          <div className="b-item-row" key={`${item.label}-${String(index)}`}>
            <span>
              {item.label}
              {item.qty > 1 && ` × ${String(item.qty)}`}
            </span>
            <span className="amt">{formatMoney(item.amount)}</span>
          </div>
        ))}
        <div className="b-total">
          <span>Total charged</span>
          <span>{formatMoney(result.total)}</span>
        </div>
      </div>

      <p className="card-meta" style={{ marginTop: 10 }}>
        A receipt has been emailed to you.
      </p>
    </div>
  );
}

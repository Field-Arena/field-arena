import Link from 'next/link';
import type { FinalizeOrderResult } from '../types';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/shadcn/card';

/**
 * The return-from-Stripe confirmation screen — mirrors rider.html's
 * #confirm-view, minus the printable-receipt/email-preview chrome (the
 * confirmation email itself, data/checkout.ts's sendOrderConfirmationEmail,
 * covers that).
 */
export function CheckoutConfirmation({
  result,
  showId,
}: {
  result: FinalizeOrderResult;
  showId: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {result.alreadyFulfilled ? 'Already confirmed' : 'Payment confirmed'}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
          <div>
            <div className="text-xs text-fa-muted">Rider number</div>
            <div className="font-semibold text-forest">#{result.riderNumber ?? '—'}</div>
          </div>
          <div>
            <div className="text-xs text-fa-muted">Amount paid</div>
            <div className="font-semibold text-forest">${result.total.toFixed(2)}</div>
          </div>
          <div>
            <div className="text-xs text-fa-muted">Order</div>
            <div className="font-mono text-xs text-forest">{result.orderId}</div>
          </div>
        </div>

        <div>
          <div className="mb-1.5 text-sm font-medium text-forest">What you entered</div>
          <ul className="space-y-1 text-sm text-forest">
            {result.items.map((item, index) => (
              <li key={`${item.label}-${index.toString()}`}>
                {item.label}
                {item.qty > 1 ? ` × ${item.qty.toString()}` : ''}
                <span className="text-fa-muted"> — ${item.amount.toFixed(2)}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="text-xs text-fa-muted">A receipt has been emailed to you.</p>

        <Link
          href={`/rider/shows/${showId}`}
          className="text-sm font-semibold text-forest underline underline-offset-2"
        >
          Back to the show page
        </Link>
      </CardContent>
    </Card>
  );
}

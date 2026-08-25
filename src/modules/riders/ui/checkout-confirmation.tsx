import Link from 'next/link';
import type { FinalizeOrderResult } from '@/modules/riders/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/shadcn/card';

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
        <CardTitle>{result.alreadyFulfilled ? 'Already confirmed' : 'Payment confirmed'}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
          <div>
            <div className="text-fa-muted text-xs">Rider number</div>
            <div className="text-forest font-semibold">#{result.riderNumber ?? '—'}</div>
          </div>
          <div>
            <div className="text-fa-muted text-xs">Amount paid</div>
            <div className="text-forest font-semibold">${result.total.toFixed(2)}</div>
          </div>
          <div>
            <div className="text-fa-muted text-xs">Order</div>
            <div className="text-forest font-mono text-xs">{result.orderId}</div>
          </div>
        </div>

        <div>
          <div className="text-forest mb-1.5 text-sm font-medium">What you entered</div>
          <ul className="text-forest space-y-1 text-sm">
            {result.items.map((item, index) => (
              <li key={`${item.label}-${index.toString()}`}>
                {item.label}
                {item.qty > 1 ? ` × ${item.qty.toString()}` : ''}
                <span className="text-fa-muted"> — ${item.amount.toFixed(2)}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="text-fa-muted text-xs">A receipt has been emailed to you.</p>

        <Link
          href={`/rider/shows/${showId}`}
          className="text-forest text-sm font-semibold underline underline-offset-2"
        >
          Back to the show page
        </Link>
      </CardContent>
    </Card>
  );
}

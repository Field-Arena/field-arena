'use client';

import { Loader2Icon } from 'lucide-react';
import { Button } from '@/shared/ui/shadcn/button';
import {
  useApproveVendorBooking,
  useRejectVendorBooking,
} from '@/modules/vendors/hooks/use-vendor-staff-mutations';

export function VendorApprovalActions({
  bookingId,
  showId,
}: {
  bookingId: string;
  showId: string;
}) {
  const { mutate: approve, isPending: approving } = useApproveVendorBooking();
  const { mutate: reject, isPending: rejecting } = useRejectVendorBooking();
  const isPending = approving || rejecting;

  return (
    <div
      className="mt-1.5 flex items-center gap-1.5"
      onClick={(e) => {
        e.stopPropagation();
      }}
    >
      <Button
        type="button"
        size="sm"
        variant="outline"
        disabled={isPending}
        onClick={() => {
          approve({ bookingId, showId });
        }}
      >
        {approving && <Loader2Icon className="animate-spin" aria-hidden />}
        Approve
      </Button>
      <Button
        type="button"
        size="sm"
        variant="ghost"
        disabled={isPending}
        onClick={() => {
          reject({ bookingId, showId });
        }}
      >
        {rejecting && <Loader2Icon className="animate-spin" aria-hidden />}
        Reject
      </Button>
    </div>
  );
}

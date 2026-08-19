import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/shadcn/dialog';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/shared/ui/shadcn/table';
import { IconX } from '@/shared/ui/organizer/icons';
import { ModalEyebrow, modalBodyClass, modalContentClass } from '@/shared/ui/organizer/modal-kit';
import { cn } from '@/shared/lib/utils';
import { formatMoneyExact } from '@/shared/lib/format/currency';
import { formatDateShort } from '@/shared/lib/format/date';
import type { BILLING_SECTIONS } from '@/modules/shows/constants';
import type { OrgBilling } from '@/modules/shows/data/queries';

type BillingKind = (typeof BILLING_SECTIONS)[number]['kind'];

export function BillingDetailDialog({
  kind,
  title,
  sub,
  billing,
  onClose,
}: {
  kind: BillingKind;
  title: string;
  sub: string;
  billing: OrgBilling;
  onClose: () => void;
}) {
  const total = billing.charges.reduce((sum, r) => sum + r.amount, 0);

  return (
    <Dialog
      open
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
    >
      <DialogContent
        className={cn(modalContentClass, 'flex max-h-[85vh] flex-col sm:max-w-[620px]')}
        showCloseButton={false}
      >
        <DialogHeader className={cn(modalBodyClass, 'flex-none gap-1.5 pb-0')}>
          <ModalEyebrow>Financial</ModalEyebrow>
          <DialogTitle className="font-serif text-2xl font-semibold text-[#0D2C23]">
            {title}
          </DialogTitle>
          <DialogDescription>{sub}</DialogDescription>
          <DialogClose className="absolute top-4 right-4 flex size-7 items-center justify-center rounded-full bg-[#E6F1EA] text-[#1A5B3C] transition-colors hover:bg-[#D5E8DC]">
            <IconX size={13} />
            <span className="sr-only">Close</span>
          </DialogClose>
        </DialogHeader>

        <div className={cn(modalBodyClass, 'min-h-0 flex-1 overflow-y-auto')}>
          {kind === 'payouts' ? (
            billing.payouts.length === 0 ? (
              <p className="text-[12.5px] leading-[1.55] text-[#6E7C76]">
                No payouts yet. Transfers appear here once the organization has completed Stripe
                Connect onboarding and the first show has ended.
              </p>
            ) : (
              <Table className="w-full border-collapse text-[12.5px]">
                <TableHeader>
                  <TableRow className="border-b border-[#D9E1DD] text-left hover:bg-transparent">
                    <TableHead className="h-auto px-0 py-1.5 font-semibold">Date</TableHead>
                    <TableHead className="h-auto px-0 py-1.5 font-semibold">Status</TableHead>
                    <TableHead className="h-auto px-0 py-1.5 text-right font-semibold">
                      Amount
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {billing.payouts.map((row) => (
                    <TableRow
                      key={row.id}
                      className="border-b border-[#EDF1EF] last:border-b-0 hover:bg-transparent"
                    >
                      <TableCell className="px-0 py-1.5 whitespace-normal">
                        {row.date ? formatDateShort(row.date) : '—'}
                      </TableCell>
                      <TableCell className="px-0 py-1.5 whitespace-normal">{row.status}</TableCell>
                      <TableCell className="px-0 py-1.5 text-right whitespace-normal">
                        {formatMoneyExact(row.amount)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )
          ) : billing.charges.length === 0 ? (
            <p className="text-[12.5px] leading-[1.55] text-[#6E7C76]">
              No {title.toLowerCase()} yet.
            </p>
          ) : (
            <>
              <Table className="w-full border-collapse text-[12.5px]">
                <TableHeader>
                  <TableRow className="border-b border-[#D9E1DD] text-left hover:bg-transparent">
                    <TableHead className="h-auto px-0 py-1.5 font-semibold">Date</TableHead>
                    <TableHead className="h-auto px-0 py-1.5 font-semibold">Show</TableHead>
                    <TableHead className="h-auto px-0 py-1.5 text-right font-semibold">
                      Amount
                    </TableHead>
                    <TableHead className="h-auto px-0 py-1.5 text-right font-semibold">
                      Platform fee
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {billing.charges.map((row) => (
                    <TableRow
                      key={row.id}
                      className="border-b border-[#EDF1EF] last:border-b-0 hover:bg-transparent"
                    >
                      <TableCell className="px-0 py-1.5 whitespace-normal">
                        {formatDateShort(row.date)}
                      </TableCell>
                      <TableCell className="px-0 py-1.5 whitespace-normal">{row.show}</TableCell>
                      <TableCell className="px-0 py-1.5 text-right whitespace-normal">
                        {formatMoneyExact(row.amount)}
                      </TableCell>
                      <TableCell className="px-0 py-1.5 text-right whitespace-normal text-[#7A8781]">
                        {formatMoneyExact(row.fee)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <p className="mt-2 text-right text-[13px] font-bold">
                Total: {formatMoneyExact(total)}
              </p>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

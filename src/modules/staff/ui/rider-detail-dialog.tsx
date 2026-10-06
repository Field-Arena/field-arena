'use client';

import { useState } from 'react';
import { Loader2Icon } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/shared/ui/shadcn/dialog';
import { Button } from '@/shared/ui/shadcn/button';
import { Input } from '@/shared/ui/shadcn/input';
import { Label } from '@/shared/ui/shadcn/label';
import { PHONE_INPUT_PROPS, sanitizePhoneInput } from '@/shared/lib/format/phone-input';
import { formatMoneyExact } from '@/shared/lib/format/currency';
import { formatDateShort } from '@/shared/lib/format/date';
import {
  useUpdateRiderContactInfo,
  useVerifyRiderHorseDocument,
} from '../hooks/use-user-directory-mutations';
import type { UserDirectoryRow, RiderDetailDocument } from '../types';

function DocumentRow({
  showId,
  horseId,
  doc,
}: {
  showId: string;
  horseId: string;
  doc: RiderDetailDocument;
}) {
  /* "saved" tracks what's actually confirmed written to the database —
   * separate from `doc` (a snapshot from when this dialog opened, which
   * stays stale for as long as the dialog is open) so a successful save
   * clears the dirty state and updates the status pill immediately, instead
   * of the Save button reappearing forever because it's still being
   * compared against the original, now-outdated prop. */
  const [savedExpiration, setSavedExpiration] = useState(doc.expirationDate ?? '');
  const [savedVerified, setSavedVerified] = useState(doc.verified ?? false);
  const [expirationDate, setExpirationDate] = useState(savedExpiration);
  const [verified, setVerified] = useState(savedVerified);
  const verify = useVerifyRiderHorseDocument({
    onSuccess: () => {
      setSavedExpiration(expirationDate);
      setSavedVerified(verified);
    },
  });

  const dirty = expirationDate !== savedExpiration || verified !== savedVerified;
  const pastDue = !!(savedExpiration && savedExpiration < new Date().toISOString().slice(0, 10));

  return (
    <li className="space-y-2 px-3 py-2.5 text-[12.5px]">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="font-semibold text-[#101828]">{doc.label}</span>
        {/* Matches legacy's cogginsCellHtml: once uploaded, the date and the
            up/ver ticks always show together -- expired only changes how the
            date renders, it never hides whether this was uploaded/verified. */}
        {!doc.uploaded ? (
          <span className="text-status-danger font-semibold">✕ Not uploaded</span>
        ) : (
          <span className="whitespace-nowrap">
            {savedExpiration ? (
              <span className={pastDue ? 'text-status-danger font-semibold' : 'text-[#101828]'}>
                {pastDue ? 'Expired ' : ''}
                {formatDateShort(savedExpiration)}
              </span>
            ) : (
              <span className="text-status-danger font-semibold">no date on file</span>
            )}{' '}
            <span className="font-semibold text-[#146A47]">✓</span>
            <span className="text-[10.5px] text-[#8A94A3]"> up</span>
            {doc.requiresApproval && (
              <>
                {' '}
                <span
                  className={
                    savedVerified ? 'font-semibold text-[#146A47]' : 'font-semibold text-[#8A6D0B]'
                  }
                >
                  {savedVerified ? '✓' : '◐'}
                </span>
                <span className="text-[10.5px] text-[#8A94A3]"> ver</span>
              </>
            )}
          </span>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-1.5 text-[#475467]">
          Expires
          <input
            type="date"
            value={expirationDate}
            onChange={(e) => {
              setExpirationDate(e.target.value);
            }}
            className="rounded-md border border-[#E7EAEE] px-2 py-1 text-[12.5px]"
          />
        </label>
        {doc.requiresApproval && (
          <label className="flex cursor-pointer items-center gap-1.5 text-[#475467]">
            <input
              type="checkbox"
              checked={verified}
              onChange={(e) => {
                setVerified(e.target.checked);
              }}
              className="size-3.5 accent-[#146A47]"
            />
            Verified
          </label>
        )}
        {dirty && (
          <Button
            type="button"
            size="sm"
            disabled={verify.isPending}
            onClick={() => {
              verify.mutate({
                showId,
                horseId,
                requirementId: doc.requirementId,
                verified: doc.requiresApproval ? verified : undefined,
                expirationDate: expirationDate || null,
              });
            }}
            className="h-auto px-2.5 py-1 text-[11.5px]"
          >
            {verify.isPending && <Loader2Icon className="size-3 animate-spin" aria-hidden />}
            Save
          </Button>
        )}
      </div>
    </li>
  );
}

export function RiderDetailDialog({
  row,
  onClose,
}: {
  row: UserDirectoryRow;
  onClose: () => void;
}) {
  const detail = row.riderDetail;
  const classesFeeTotal = detail?.classes.reduce((sum, c) => sum + c.fee, 0) ?? 0;
  const riderId = detail?.riderId ?? null;

  const [firstName, setFirstName] = useState(row.firstName ?? '');
  const [lastName, setLastName] = useState(row.lastName ?? '');
  const [phone, setPhone] = useState(row.phone ?? '');
  const updateContact = useUpdateRiderContactInfo();

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl text-[#101828]">{row.name}</DialogTitle>
          <DialogDescription>{row.showName} · Rider</DialogDescription>
        </DialogHeader>

        {riderId && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="rd-first-name">First name</Label>
                <Input
                  id="rd-first-name"
                  value={firstName}
                  maxLength={80}
                  onChange={(e) => {
                    setFirstName(e.target.value);
                  }}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="rd-last-name">Last name</Label>
                <Input
                  id="rd-last-name"
                  value={lastName}
                  maxLength={80}
                  onChange={(e) => {
                    setLastName(e.target.value);
                  }}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="rd-email">Email</Label>
              <Input id="rd-email" value={row.email ?? ''} disabled />
              <p className="text-[11.5px] text-[#8A94A3]">
                This is the rider&apos;s sign-in email — it can&apos;t be changed here.
              </p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="rd-phone">Phone</Label>
              <Input
                id="rd-phone"
                {...PHONE_INPUT_PROPS}
                value={phone}
                onChange={(e) => {
                  setPhone(sanitizePhoneInput(e.target.value));
                }}
              />
            </div>
            <div className="flex justify-end">
              <Button
                type="button"
                variant="outline"
                disabled={updateContact.isPending}
                onClick={() => {
                  updateContact.mutate({
                    riderId,
                    showId: row.showId,
                    firstName,
                    lastName,
                    phone,
                  });
                }}
              >
                {updateContact.isPending && <Loader2Icon className="animate-spin" aria-hidden />}
                {updateContact.isPending ? 'Saving…' : 'Save details'}
              </Button>
            </div>
          </div>
        )}

        {!detail || (detail.horses.length === 0 && detail.classes.length === 0) ? (
          <p className="text-[13.5px] text-[#8A94A3] italic">No entries on file for this show.</p>
        ) : (
          <div className="space-y-5">
            {detail.horses.length > 0 && (
              <div className="space-y-3">
                {detail.horses.map((horse) => (
                  <div key={horse.id} className="rounded-lg border border-[#EEF1F4] p-3">
                    <p className="mb-1 text-[13.5px] font-bold text-[#101828]">{horse.name}</p>
                    <p className="mb-2 text-[11px] text-[#8A94A3]">
                      A horse&apos;s registered name can&apos;t be changed once entered.
                    </p>
                    {horse.documents.length === 0 ? (
                      <p className="text-[12.5px] text-[#8A94A3]">
                        No document requirements set for this show.
                      </p>
                    ) : (
                      <ul className="divide-y divide-[#EEF1F4]">
                        {horse.documents.map((doc) => (
                          <DocumentRow
                            key={doc.requirementId}
                            showId={row.showId}
                            horseId={horse.id}
                            doc={doc}
                          />
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            )}

            {detail.classes.length > 0 && (
              <div>
                <p className="mb-1.5 text-[12px] font-bold tracking-[.06em] text-[#101828] uppercase">
                  Classes entered
                </p>
                <ul className="divide-y divide-[#EEF1F4] rounded-lg border border-[#EEF1F4]">
                  {detail.classes.map((c, i) => (
                    <li
                      key={`${c.label}-${String(i)}`}
                      className="flex items-center justify-between gap-3 px-3 py-2 text-[13px]"
                    >
                      <span className="text-[#101828]">{c.label}</span>
                      <span className="text-[#475467]">{formatMoneyExact(c.fee)}</span>
                    </li>
                  ))}
                  <li className="flex items-center justify-between gap-3 px-3 py-2 text-[13px] font-bold">
                    <span>Total</span>
                    <span>{formatMoneyExact(classesFeeTotal)}</span>
                  </li>
                </ul>
              </div>
            )}

            {detail.addOns.length > 0 && (
              <div>
                <p className="mb-1.5 text-[12px] font-bold tracking-[.06em] text-[#101828] uppercase">
                  Stabling &amp; add-ons
                </p>
                <ul className="divide-y divide-[#EEF1F4] rounded-lg border border-[#EEF1F4]">
                  {detail.addOns.map((a, i) => (
                    <li
                      key={`${a.label}-${String(i)}`}
                      className="flex items-center justify-between gap-3 px-3 py-2 text-[13px]"
                    >
                      <span className="text-[#101828]">
                        {a.label}
                        {a.qty > 1 && <span className="text-[#8A94A3]"> × {a.qty}</span>}
                      </span>
                      <span className="text-[#475467]">{formatMoneyExact(a.amount)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

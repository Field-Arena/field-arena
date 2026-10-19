'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/shadcn/dialog';
import { PrimaryButton, GhostButton } from '@/shared/ui/organizer/buttons';
import {
  ModalEyebrow,
  modalBodyClass,
  modalContentClass,
  modalFooterClass,
} from '@/shared/ui/organizer/modal-kit';
import { useRefreshClassesFromTemplate } from '@/modules/shows/hooks/use-test-builder-mutations';
import { TEST_REFRESH_SKIP_REASON_LABELS } from '@/modules/shows/constants';
import type { AssignedClassOption } from '@/modules/shows/types';

export interface RefreshOffer {
  templateId: string;
  templateName: string;
  classes: AssignedClassOption[];
}

function plural(n: number, one: string, many: string): string {
  return `${String(n)} ${n === 1 ? one : many}`;
}

/* Shown after saving an org test that classes on this show already use.
 * Assigning copies the test into each class, so the edit hasn't reached them
 * yet — this offers to re-copy it. The server only touches classes with no
 * scores and unpublished results; the rest are reported back as skipped. */
export function RefreshClassesDialog({
  offer,
  showId,
  onClose,
}: {
  offer: RefreshOffer | null;
  /** The show's uuid (not the URL slug). */
  showId: string;
  onClose: () => void;
}) {
  const refresh = useRefreshClassesFromTemplate();
  const result = refresh.data;

  function close() {
    refresh.reset();
    onClose();
  }

  const count = offer?.classes.length ?? 0;

  return (
    <Dialog
      open={offer !== null}
      onOpenChange={(next) => {
        if (!next && !refresh.isPending) close();
      }}
    >
      <DialogContent className={`${modalContentClass} sm:max-w-[520px]`}>
        <div className={modalBodyClass}>
          <DialogHeader>
            <ModalEyebrow>Test saved</ModalEyebrow>
            <DialogTitle className="text-[17px] font-semibold text-[#101828]">
              {result
                ? 'Classes updated'
                : `Update ${plural(count, 'class', 'classes')} using this test?`}
            </DialogTitle>
            <DialogDescription className="text-[13px] leading-relaxed text-[#475467]">
              {result ? (
                <>
                  &ldquo;{offer?.templateName}&rdquo; is now on{' '}
                  {plural(result.updated.length, 'class', 'classes')}.
                </>
              ) : (
                <>
                  Classes keep their own copy of a test, so your changes to &ldquo;
                  {offer?.templateName}&rdquo; haven&apos;t reached them yet. Classes that have
                  started scoring or have published results are skipped and keep the sheet their
                  judges are using.
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          {result ? (
            <div className="flex flex-col gap-3 text-[13px]">
              {result.updated.length > 0 && (
                <div>
                  <div className="mb-1 text-[12px] font-semibold text-[#146A47]">Updated</div>
                  <ul className="list-disc space-y-0.5 pl-5 text-[#101828]">
                    {result.updated.map((c) => (
                      <li key={c.classId}>{c.label}</li>
                    ))}
                  </ul>
                </div>
              )}
              {result.skipped.length > 0 && (
                <div>
                  <div className="mb-1 text-[12px] font-semibold text-[#B45309]">
                    Skipped — still on the previous version
                  </div>
                  <ul className="list-disc space-y-0.5 pl-5 text-[#101828]">
                    {result.skipped.map((c) => (
                      <li key={c.classId}>
                        {c.label}{' '}
                        <span className="text-[#8A94A3]">
                          ({TEST_REFRESH_SKIP_REASON_LABELS[c.reason]})
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {result.updated.length === 0 && result.skipped.length === 0 && (
                <p className="text-[#8A94A3]">No classes on this show use this test anymore.</p>
              )}
            </div>
          ) : (
            <ul className="max-h-[220px] list-disc space-y-0.5 overflow-y-auto pl-5 text-[13px] text-[#101828]">
              {offer?.classes.map((c) => (
                <li key={c.classId}>{c.label}</li>
              ))}
            </ul>
          )}
        </div>

        <DialogFooter className={modalFooterClass}>
          {result ? (
            <PrimaryButton onClick={close}>Done</PrimaryButton>
          ) : (
            <>
              <GhostButton disabled={refresh.isPending} onClick={close}>
                Not now
              </GhostButton>
              <PrimaryButton
                disabled={refresh.isPending || !offer}
                onClick={() => {
                  if (offer) refresh.mutate({ templateId: offer.templateId, showId });
                }}
              >
                {refresh.isPending ? 'Updating…' : 'Update classes'}
              </PrimaryButton>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

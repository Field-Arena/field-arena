'use client';

import { useState } from 'react';
import { ArrowLeftIcon, ExternalLinkIcon } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/shared/ui/shadcn/dialog';
import { Button } from '@/shared/ui/shadcn/button';
import { cn } from '@/shared/lib/utils';

type PreviewKind = 'pdf' | 'image' | 'none';

const IMAGE_EXT = /\.(png|jpe?g|gif|webp|avif|svg|bmp)$/i;

function previewKind(name: string, url: string): PreviewKind {
  // Storage URLs carry a signing token in the query string, so test the path
  // (and the display name, which keeps the original extension) — not the raw URL.
  const path = url.split(/[?#]/)[0] ?? '';
  const candidates = [name, path];
  if (candidates.some((c) => /\.pdf$/i.test(c))) return 'pdf';
  if (candidates.some((c) => IMAGE_EXT.test(c))) return 'image';
  return 'none';
}

/** "View" for an uploaded document that keeps the organizer in place.
 *
 * Opening the raw file (a target=_blank link) left people stranded on a bare
 * PDF with no way back to the show builder — on many browsers and on mobile it
 * replaces the tab outright. This previews the file in a modal over the page
 * instead, with an explicit back control, Esc / click-outside to close, and a
 * new-tab link for anyone who does want the file on its own. */
export function DocumentViewerDialog({
  url,
  name,
  backLabel = 'Back to Show Manager',
  triggerLabel = 'View',
  triggerClassName,
}: {
  url: string;
  name: string;
  backLabel?: string;
  triggerLabel?: string;
  triggerClassName?: string;
}) {
  const [open, setOpen] = useState(false);
  const kind = previewKind(name, url);

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        onClick={() => {
          setOpen(true);
        }}
        className={cn(
          'text-forest h-auto bg-transparent p-0 text-[13px] font-semibold underline underline-offset-2 hover:bg-transparent',
          triggerClassName,
        )}
      >
        {triggerLabel}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          showCloseButton={false}
          className="flex h-[88vh] w-[min(1100px,calc(100vw-2rem))] flex-col gap-0 overflow-hidden rounded-2xl border border-[#E9EDEB] bg-white p-0 sm:max-w-none"
        >
          <div className="flex flex-wrap items-center gap-3 border-b border-[#E9EDEB] bg-[#F5F7F6] px-4 py-3">
            <Button
              type="button"
              onClick={() => {
                setOpen(false);
              }}
              className="bg-forest hover:bg-hunter h-auto rounded-[9px] px-3.5 py-2 text-[13px] font-bold text-white"
            >
              <ArrowLeftIcon className="size-4" aria-hidden />
              {backLabel}
            </Button>
            <div className="min-w-0 flex-1">
              <DialogTitle className="text-ink-deep truncate text-[14px] leading-tight font-semibold">
                {name}
              </DialogTitle>
              <DialogDescription className="text-[12px] text-[#5A6B63]">
                Press Esc or click outside to close.
              </DialogDescription>
            </div>
            <a
              href={url}
              target="_blank"
              rel="noreferrer"
              className="text-forest inline-flex items-center gap-1.5 text-[13px] font-semibold underline underline-offset-2"
            >
              Open in new tab
              <ExternalLinkIcon className="size-3.5" aria-hidden />
            </a>
          </div>

          <div className="min-h-0 flex-1 bg-[#EEF1EF]">
            {kind === 'pdf' && <iframe src={url} title={name} className="size-full border-0" />}
            {kind === 'image' && (
              // eslint-disable-next-line @next/next/no-img-element -- signed storage URL, not a static asset
              <img src={url} alt={name} className="mx-auto size-full object-contain p-4" />
            )}
            {kind === 'none' && (
              <div className="grid size-full place-items-center p-6 text-center">
                <p className="max-w-[420px] text-[13.5px] text-[#5A6B63]">
                  This file type can&rsquo;t be previewed here. Use &ldquo;Open in new tab&rdquo; to
                  download or open it.
                </p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

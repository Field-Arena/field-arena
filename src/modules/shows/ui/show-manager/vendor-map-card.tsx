'use client';

import { useRef, useState } from 'react';
import { Loader2Icon } from 'lucide-react';
import { Card } from '@/shared/ui/organizer/card';
import { Button } from '@/shared/ui/shadcn/button';
import { Input } from '@/shared/ui/shadcn/input';
import { cn } from '@/shared/lib/utils';
import { readFileAsBase64 } from '@/modules/shows/utils/read-file-as-base64';
import {
  useUploadVendorMap,
  useRemoveVendorMap,
} from '@/modules/shows/hooks/use-catalog-mutations';
import type { RiderEntriesData } from '@/modules/shows/data/setup-queries';
import {
  SM_CARD_PAD,
  SM_SECTION_HEAD,
  SM_NOTE,
  SM_GREEN_BTN,
  SM_GHOST_BTN,
} from '@/modules/shows/ui/show-manager/tokens';

export function VendorMapCard({ data }: { data: RiderEntriesData }) {
  const [file, setFile] = useState<File | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const upload = useUploadVendorMap();
  const remove = useRemoveVendorMap();

  return (
    <Card className={SM_CARD_PAD}>
      <h2 className={SM_SECTION_HEAD}>Vendor Space Map</h2>
      <p className={SM_NOTE}>
        Upload a booth/space layout map (PDF or image) — shown to vendors applying for this show so
        they can pick a spot.
      </p>

      {data.vendorMapUrl ? (
        <p className="mb-3 text-[13px]">
          <a
            href={data.vendorMapUrl}
            target="_blank"
            rel="noreferrer"
            className="text-forest font-semibold underline"
          >
            View the uploaded map
          </a>
        </p>
      ) : (
        <p className="mb-3 text-[13px] text-[#98A29D] italic">No map uploaded yet</p>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <Input
          ref={inputRef}
          type="file"
          accept="image/*,application/pdf"
          className="file:text-forest hover:file:border-gold h-auto w-auto min-w-0 cursor-pointer rounded-none border-0 bg-transparent px-0 py-0 text-[12.5px] text-[#6E7C76] file:mr-3 file:cursor-pointer file:rounded-[9px] file:border file:border-[#D9E1DD] file:bg-white file:px-3.5 file:py-2 file:text-[12.5px] file:font-semibold"
          onChange={(e) => {
            setFile(e.target.files?.[0] ?? null);
          }}
          aria-label="Vendor space map file"
        />
        <Button
          type="button"
          variant="ghost"
          className={cn('h-auto', SM_GREEN_BTN)}
          disabled={!file || upload.isPending}
          onClick={() => {
            if (!file) return;
            void readFileAsBase64(file).then(({ dataBase64, contentType }) => {
              upload.mutate(
                { showId: data.showId, name: file.name, dataBase64, contentType },
                {
                  onSuccess: () => {
                    setFile(null);
                    if (inputRef.current) inputRef.current.value = '';
                  },
                },
              );
            });
          }}
        >
          {upload.isPending && <Loader2Icon className="size-4 animate-spin" aria-hidden />}
          Upload map
        </Button>

        {data.vendorMapUrl && (
          <Button
            type="button"
            variant="ghost"
            className={cn('h-auto', SM_GHOST_BTN, 'hover:bg-white')}
            disabled={remove.isPending}
            onClick={() => {
              remove.mutate(data.showId);
            }}
          >
            Remove map
          </Button>
        )}
      </div>
    </Card>
  );
}

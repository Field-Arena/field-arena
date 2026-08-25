'use client';

import { ArrowUpIcon, Loader2Icon } from 'lucide-react';
import { Input } from '@/shared/ui/shadcn/input';
import { Label } from '@/shared/ui/shadcn/label';
import { cn } from '@/shared/lib/utils';
import { readFileAsBase64 } from '@/modules/shows/utils/read-file-as-base64';
import { useUploadShowBranding } from '@/modules/shows/hooks/use-catalog-mutations';

export function BrandingSlot({
  showId,
  kind,
  label,
  hint,
  prompt,
  url,
}: {
  showId: string;
  kind: 'logo' | 'banner';
  label: string;
  hint: string;
  prompt: string;
  url: string | null;
}) {
  const upload = useUploadShowBranding();

  return (
    <div>
      <div className="text-ink-deep text-[13px] font-bold">{label}</div>
      <div className="mb-2 text-[11.5px] text-[#98A29D]">{hint}</div>

      <Label
        className={cn(
          'grid min-h-[104px] cursor-pointer place-items-center gap-1.5 rounded-[10px]',
          'border border-dashed border-[#D9E1DD] bg-white p-3 text-center transition-colors',
          'hover:border-gold',
        )}
      >
        <Input
          type="file"
          accept="image/*"
          className="sr-only h-auto"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            void readFileAsBase64(file).then(({ dataBase64, contentType }) => {
              upload.mutate({ showId, kind, name: file.name, dataBase64, contentType });
            });
          }}
        />
        {upload.isPending ? (
          <Loader2Icon className="size-5 animate-spin text-[#6E7C76]" aria-hidden />
        ) : url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={url}
            alt={`${label} for this show`}
            className="max-h-[150px] max-w-full rounded-[6px] object-contain"
          />
        ) : (
          <>
            <ArrowUpIcon className="size-[17px] text-[#6E7C76]" aria-hidden />
            <span className="text-[12.5px] text-[#6E7C76]">{prompt}</span>
          </>
        )}
      </Label>
    </div>
  );
}

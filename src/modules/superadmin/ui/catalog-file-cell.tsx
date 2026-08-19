'use client';

import { useRef } from 'react';
import { UploadIcon } from 'lucide-react';
import { Button } from '@/shared/ui/shadcn/button';
import { Input } from '@/shared/ui/shadcn/input';
import type { CatalogDocument } from '@/modules/superadmin/types';
import { readFileAsBase64 } from '@/modules/superadmin/utils/read-file-as-base64';
import { useUploadDocument } from '@/modules/superadmin/hooks/use-document-mutations';

export function CatalogFileCell({
  doc,
  sourceFile,
}: {
  doc: CatalogDocument | undefined;
  sourceFile: string | null;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const upload = useUploadDocument();

  if (doc?.url) {
    return (
      <a
        href={doc.url}
        target="_blank"
        rel="noreferrer"
        className="hover:text-gold text-[13px] font-semibold text-[#16261F] underline underline-offset-[3px]"
      >
        View PDF
      </a>
    );
  }

  if (!sourceFile) {
    return (
      <span className="inline-flex h-6 items-center rounded-md border border-dashed border-[#C9B98A] px-2.5 text-[11.5px] font-semibold whitespace-nowrap text-[#9AA6A0]">
        No file
      </span>
    );
  }

  return (
    <>
      <Input
        ref={ref}
        type="file"
        accept="application/pdf,image/*"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) {
            void readFileAsBase64(file).then(({ dataBase64, contentType }) => {
              upload.mutate({ folder: 'Tests', name: sourceFile, dataBase64, contentType });
            });
          }
          event.target.value = '';
        }}
      />
      <Button
        type="button"
        variant="ghost"
        disabled={upload.isPending}
        onClick={() => ref.current?.click()}
        className="hover:text-gold inline-flex h-auto items-center gap-1.5 p-0 text-[13px] font-bold text-[#8A6D14] transition-colors hover:bg-transparent disabled:opacity-60"
      >
        <UploadIcon className="size-[13px]" aria-hidden />
        {upload.isPending ? 'Uploading…' : 'Upload'}
      </Button>
    </>
  );
}

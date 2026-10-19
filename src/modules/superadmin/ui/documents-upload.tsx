'use client';

import { useRef, useState } from 'react';
import { UploadIcon } from 'lucide-react';
import { Button } from '@/shared/ui/shadcn/button';
import { Input } from '@/shared/ui/shadcn/input';

export function DocumentsUpload({ onFiles }: { onFiles: (files: FileList) => void }) {
  const ref = useRef<HTMLInputElement>(null);
  const [label, setLabel] = useState('No file chosen');
  return (
    <div className="flex flex-wrap items-center gap-4">
      <Input
        ref={ref}
        type="file"
        accept="application/pdf,image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          const files = e.target.files;
          if (files?.length) {
            setLabel(
              files.length === 1 ? (files[0]?.name ?? '1 file') : `${String(files.length)} files`,
            );
            onFiles(files);
          }
          e.target.value = '';
        }}
      />
      <Button
        type="button"
        variant="ghost"
        onClick={() => ref.current?.click()}
        className="inline-flex h-auto items-center rounded-[7px] border border-[#E7EAEE] bg-white px-3.5 py-2 text-[13px] font-semibold text-[#101828] hover:bg-transparent"
      >
        Choose files
      </Button>
      <span className="text-[13px] text-[#8A94A3]">{label}</span>
      <Button
        type="button"
        variant="ghost"
        onClick={() => ref.current?.click()}
        className="inline-flex h-auto items-center gap-1.5 rounded-[9px] bg-[#0E5537] px-5 py-2.5 text-[13.5px] font-bold text-white transition hover:bg-[#146A47] hover:text-white"
      >
        <UploadIcon className="size-[14px]" aria-hidden />
        Upload
      </Button>
    </div>
  );
}

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
            setLabel(files.length === 1 ? (files[0]?.name ?? '1 file') : `${String(files.length)} files`);
            onFiles(files);
          }
          e.target.value = '';
        }}
      />
      <Button
        type="button"
        variant="ghost"
        onClick={() => ref.current?.click()}
        className="h-auto inline-flex items-center rounded-[7px] border border-[#D7CFBB] bg-white px-3.5 py-2 text-[13px] font-semibold text-[#16261F] hover:bg-transparent"
      >
        Choose files
      </Button>
      <span className="text-[13px] text-[#9AA6A0]">{label}</span>
      <Button
        type="button"
        variant="ghost"
        onClick={() => ref.current?.click()}
        className="h-auto inline-flex items-center gap-1.5 rounded-[9px] bg-[#17402F] px-5 py-2.5 text-[13.5px] font-bold text-paper hover:bg-gold transition hover:text-hunter-deep"
      >
        <UploadIcon className="size-[14px]" aria-hidden />
        Upload
      </Button>
    </div>
  );
}

'use client';

import { useRef, useState } from 'react';
import { Button } from '@/shared/ui/shadcn/button';
import { Input } from '@/shared/ui/shadcn/input';
import { cn } from '@/shared/lib/utils';

export function BulkDrop({ onFiles }: { onFiles: (files: FileList) => void }) {
  const ref = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  return (
    <Button
      type="button"
      variant="ghost"
      onClick={() => ref.current?.click()}
      onDragOver={(e) => {
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => {
        setOver(false);
      }}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        if (e.dataTransfer.files.length) onFiles(e.dataTransfer.files);
      }}
      className={cn(
        'flex h-auto w-full flex-col items-center justify-start gap-3 rounded-xl border border-dashed px-6 py-[30px] transition-colors',
        over ? 'border-gold bg-[#FCFAF4]' : 'hover:border-gold border-[#C9B98A] hover:bg-[#FCFAF4]',
      )}
    >
      <Input
        ref={ref}
        type="file"
        accept="application/pdf,image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.length) onFiles(e.target.files);
          e.target.value = '';
        }}
      />
      <span className="text-center text-[14px] text-[#5A6B63]">
        Drag and drop test sheet PDFs here — each is matched to its test automatically by filename.
      </span>
      <span className="inline-flex items-center gap-2 rounded-lg border border-[#D7CFBB] bg-white px-4 py-2.5 text-[13px] font-semibold text-[#16261F]">
        Choose files
      </span>
    </Button>
  );
}

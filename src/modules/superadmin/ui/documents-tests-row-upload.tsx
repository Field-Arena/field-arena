'use client';

import { useRef } from 'react';
import { UploadIcon } from 'lucide-react';
import { Button } from '@/shared/ui/shadcn/button';
import { Input } from '@/shared/ui/shadcn/input';

export function RowUpload({ onFile }: { onFile: (file: File) => void }) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <>
      <Input
        ref={ref}
        type="file"
        accept="application/pdf,image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onFile(file);
          e.target.value = '';
        }}
      />
      <Button
        type="button"
        variant="ghost"
        onClick={() => ref.current?.click()}
        className="h-auto px-0 py-0 inline-flex items-center gap-1.5 text-[13px] font-bold text-[#8A6D14] hover:bg-transparent hover:text-gold"
      >
        <UploadIcon className="size-[13px]" aria-hidden />
        Upload
      </Button>
    </>
  );
}

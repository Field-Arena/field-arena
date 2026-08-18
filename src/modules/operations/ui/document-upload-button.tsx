'use client';
import type { ChangeEvent } from 'react';
import { Input } from '@/shared/ui/shadcn/input';
import { useUploadShowDocument } from '@/modules/operations/hooks/use-document-mutations';

/**
 * "+ Upload PDF", ported from viewDocuments()'s hidden file input. Loops over
 * every selected file, silently skips anything that isn't a PDF (same as
 * legacy), and reads each one to base64 client-side before handing it to the
 * upload Server Action.
 */
export function DocumentUploadButton({ showId }: { showId: string }) {
  const { mutate, isPending } = useUploadShowDocument();

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    for (const file of files) {
      if (file.type !== 'application/pdf') continue;
      const reader = new FileReader();
      reader.onload = () => {
        const result = typeof reader.result === 'string' ? reader.result : '';
        const dataBase64 = result.split(',')[1] ?? '';
        mutate({ showId, name: file.name, dataBase64, contentType: 'application/pdf' });
      };
      reader.readAsDataURL(file);
    }
    event.target.value = '';
  }

  return (
    <label className="dash-btn dash-btn-dark" style={{ cursor: 'pointer', display: 'inline-flex' }}>
      {isPending ? 'Uploading…' : '+ Upload PDF'}
      <Input
        type="file"
        accept="application/pdf"
        multiple
        onChange={handleChange}
        disabled={isPending}
        className="h-auto"
        style={{ display: 'none' }}
      />
    </label>
  );
}

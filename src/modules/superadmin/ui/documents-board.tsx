'use client';

import { useState } from 'react';
import { Button } from '@/shared/ui/shadcn/button';
import { cn } from '@/shared/lib/utils';
import type { CatalogDocument, TestSheetItem } from '@/modules/superadmin/types';
import { DocumentsTestsTab } from '@/modules/superadmin/ui/documents-tests-tab';
import { DocumentsGeneralTab } from '@/modules/superadmin/ui/documents-general-tab';

export function DocumentsBoard({
  testSheets,
  docs,
}: {
  testSheets: TestSheetItem[];
  docs: CatalogDocument[];
}) {
  const [tab, setTab] = useState<'tests' | 'documents'>('tests');

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2.5">
        {(['tests', 'documents'] as const).map((t) => (
          <Button
            key={t}
            type="button"
            variant="ghost"
            onClick={() => {
              setTab(t);
            }}
            className={cn(
              'h-auto rounded-full border px-5 py-2 text-[13.5px] font-semibold transition-colors hover:bg-transparent',
              tab === t
                ? 'border-hunter-deep bg-hunter-deep text-paper'
                : 'hover:border-hunter-deep border-[#D7E0DA] bg-white text-[#5A6B63]',
            )}
          >
            {t === 'tests' ? 'Tests' : 'Documents'}
          </Button>
        ))}
      </div>

      {tab === 'tests' ? (
        <DocumentsTestsTab testSheets={testSheets} docs={docs} />
      ) : (
        <DocumentsGeneralTab docs={docs} />
      )}
    </div>
  );
}

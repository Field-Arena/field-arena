'use client';

import { useState } from 'react';
import { cn } from '@/shared/lib/utils';
import type { CatalogDocument, TestSheetItem } from '../types';
import { DocumentsTestsTab } from './documents-tests-tab';
import { DocumentsGeneralTab } from './documents-general-tab';

/**
 * The platform file store, matching the Admin Console design: a Tests tab that
 * matches uploads to catalog sheets by filename, and a Documents tab for
 * everything else. Uploads/downloads/deletes hit Supabase Storage.
 *
 * Composes DocumentsTestsTab / DocumentsGeneralTab, which each own their tab's
 * markup and mutations — this component only owns which tab is showing.
 */
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
          <button
            key={t}
            type="button"
            onClick={() => {
              setTab(t);
            }}
            className={cn(
              'rounded-full border px-5 py-2 text-[13.5px] font-semibold transition-colors',
              tab === t
                ? 'border-hunter-deep bg-hunter-deep text-paper'
                : 'border-[#D7E0DA] bg-white text-[#5A6B63] hover:border-hunter-deep'
            )}
          >
            {t === 'tests' ? 'Tests' : 'Documents'}
          </button>
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

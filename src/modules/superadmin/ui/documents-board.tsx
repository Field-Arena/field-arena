'use client';

import { useState } from 'react';
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
      <div className="fa-subtoggle !mb-0">
        {(['tests', 'documents'] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => {
              setTab(t);
            }}
            className={tab === t ? 'fa-active' : undefined}
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

import type { Metadata } from 'next';
import { listCatalogDocuments, listScoringCatalog } from '@/modules/superadmin/data/queries';
import { DocumentsBoard } from '@/modules/superadmin/ui/documents-board';
import { toTestSheetItems } from '@/modules/superadmin/utils/to-test-sheet-items';

export const metadata: Metadata = {
  title: 'Documents — SuperAdmin Console',
};


export default async function PlatformDocumentsPage() {
  const [sheets, docs] = await Promise.all([listScoringCatalog(), listCatalogDocuments()]);

  const testSheets = toTestSheetItems(sheets);

  return (
    <div className="space-y-7">
      <div className="max-w-[680px]">
        <h1 className="mb-2 font-[family-name:var(--fa-serif)] text-[29px] leading-tight font-semibold tracking-[-.5px] text-[#101828]">
          Documents
        </h1>
        <p className="text-[14.5px] leading-[1.6] text-[#475467]">
          Real files stored on the platform, organized into folders.{' '}
          <strong className="font-semibold text-[#101828]">Tests:</strong> attach the real PDF for
          every official test the Scoring Catalog already lists.{' '}
          <strong className="font-semibold text-[#101828]">Documents:</strong> anything else —
          waivers, glossaries, agreements.
        </p>
      </div>

      <DocumentsBoard testSheets={testSheets} docs={docs} />
    </div>
  );
}

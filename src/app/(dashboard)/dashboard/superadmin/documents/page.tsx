import type { Metadata } from 'next';
import { listCatalogDocuments, listScoringCatalog } from '@/modules/superadmin/data/queries';
import { DocumentsBoard } from '@/modules/superadmin/ui/documents-board';
import { toTestSheetItems } from '@/modules/superadmin/utils/to-test-sheet-items';

export const metadata: Metadata = {
  title: 'Documents — SuperAdmin Console',
};

const NR = 'font-[family-name:var(--font-nr)]';

export default async function PlatformDocumentsPage() {
  const [sheets, docs] = await Promise.all([listScoringCatalog(), listCatalogDocuments()]);

  const testSheets = toTestSheetItems(sheets);

  return (
    <div className="space-y-7">
      <div className="max-w-[680px]">
        <div className="text-gold mb-3 text-[10.5px] font-bold tracking-[0.18em] uppercase">
          File store
        </div>
        <h1
          className={`${NR} text-hunter-deep mb-2.5 text-[32px] leading-[1.06] font-medium tracking-[-.022em]`}
        >
          Documents
        </h1>
        <p className="text-fa-muted text-[14.5px] leading-[1.6]">
          Real files stored on the platform, organized into folders.{' '}
          <strong className="text-hunter-deep font-semibold">Tests:</strong> attach the real PDF for
          every official test the Scoring Catalog already lists.{' '}
          <strong className="text-hunter-deep font-semibold">Documents:</strong> anything else —
          waivers, glossaries, agreements.
        </p>
      </div>

      <DocumentsBoard testSheets={testSheets} docs={docs} />
    </div>
  );
}

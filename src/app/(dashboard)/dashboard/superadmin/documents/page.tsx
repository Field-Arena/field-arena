import type { Metadata } from 'next';
import { listCatalogDocuments, listScoringCatalog } from '@/modules/superadmin/data/queries';
import { DocumentsBoard, type TestSheetItem } from '@/modules/superadmin/ui/documents-board';

export const metadata: Metadata = {
  title: 'Documents — SuperAdmin Console',
};

const NR = 'font-[family-name:var(--font-nr)]';

//dummy pr
/**
 * The platform file store, matching the Admin Console design. Two folders: Tests
 * (the real PDF behind every official sheet the Scoring Catalog lists) and
 * Documents (everything else — waivers, glossaries, agreements). Files live in
 * the private catalog-docs bucket; the board handles upload/download/delete.
 */
export default async function PlatformDocumentsPage() {
  const [sheets, docs] = await Promise.all([listScoringCatalog(), listCatalogDocuments()]);

  const testSheets: TestSheetItem[] = sheets
    .filter((s) => s.source_file)
    .map((s) => ({ id: s.id, title: s.title, level: s.level, sourceFile: s.source_file ?? '' }));

  return (
    <div className="space-y-7">
      <div className="max-w-[680px]">
        <div className="mb-3 text-[10.5px] font-bold uppercase tracking-[0.18em] text-gold">
          File store
        </div>
        <h1 className={`${NR} mb-2.5 text-[32px] font-medium leading-[1.06] tracking-[-.022em] text-hunter-deep`}>
          Documents
        </h1>
        <p className="text-[14.5px] leading-[1.6] text-fa-muted">
          Real files stored on the platform, organized into folders.{' '}
          <strong className="font-semibold text-hunter-deep">Tests:</strong> attach the real PDF for
          every official test the Scoring Catalog already lists.{' '}
          <strong className="font-semibold text-hunter-deep">Documents:</strong> anything else —
          waivers, glossaries, agreements.
        </p>
      </div>

      <DocumentsBoard testSheets={testSheets} docs={docs} />
    </div>
  );
}

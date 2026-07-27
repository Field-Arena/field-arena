import type { Metadata } from 'next';
import { createServerClient } from '@/shared/lib/supabase/server';
import { StatTile } from '@/shared/ui/stat-tile';
import { formatTimestamp } from '@/shared/lib/format/date';

export const metadata: Metadata = {
  title: 'Documents — SuperAdmin Console',
};

/**
 * Platform-level reference files, chiefly the "Tests" folder of source PDFs.
 *
 * Distinct from per-show documents, which belong to one show and appear in the
 * organizer workspace. Deliberately no foreign key to the scoring catalog: a
 * catalog entry may have no source PDF, and a PDF may be uploaded before anyone
 * builds its catalog entry.
 */
export default async function PlatformDocumentsPage() {
  const supabase = await createServerClient();

  const { data: docs, error } = await supabase
    .from('catalog_documents')
    .select('id, folder, name, url, created_at')
    .order('folder')
    .order('name');
  if (error) throw error;

  const folders = new Set(docs.map((d) => d.folder));

  return (
    <div className="space-y-6">
      <div className="max-w-[640px]">
        <h1 className="mb-2 font-serif text-[30px] font-bold leading-tight text-hunter-deep">
          Documents
        </h1>
        <p className="text-fa-muted text-[14.5px] leading-relaxed">
          Platform-level reference files, separate from any one show&rsquo;s document library.
        </p>
      </div>

      <section aria-label="Document totals">
        <div className="flex flex-wrap gap-3">
          <StatTile label="Files" value={docs.length} className="min-w-[128px]" />
          <StatTile label="Folders" value={folders.size} className="min-w-[128px]" />
        </div>
      </section>

      <section aria-label="Files" className="space-y-3">
        {docs.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-white px-5 py-8 text-center">
            <p className="mb-1 font-semibold text-hunter-deep">No files uploaded</p>
            <p className="text-fa-muted text-sm">
              Storage buckets exist and are scoped by path, but nothing has been uploaded to the
              platform catalog yet. Upload is part of the file-management pass.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border bg-white">
            <table className="w-full border-collapse text-[13.5px]">
              <caption className="sr-only">Platform reference documents</caption>
              <thead>
                <tr className="bg-hunter-pale">
                  {['Name', 'Folder', 'Added'].map((heading) => (
                    <th
                      key={heading}
                      scope="col"
                      className="text-fa-muted px-3 py-2.5 text-left text-[11px] font-bold uppercase tracking-[0.04em]"
                    >
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {docs.map((doc) => (
                  <tr key={doc.id} className="border-b border-border last:border-b-0">
                    <td className="px-3 py-2.5 font-semibold text-hunter-deep">{doc.name}</td>
                    <td className="text-fa-muted px-3 py-2.5">{doc.folder}</td>
                    <td className="text-fa-muted px-3 py-2.5">{formatTimestamp(doc.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

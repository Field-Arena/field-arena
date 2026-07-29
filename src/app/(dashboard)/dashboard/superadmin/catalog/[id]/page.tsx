import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getScoringSheet } from '@/modules/superadmin/data/queries';
import { SheetDetail } from '@/modules/superadmin/ui/sheet-detail';

export const metadata: Metadata = {
  title: 'Sheet — Scoring Catalog',
};

/** A single catalog sheet, editable in SheetDetail. 404s when it cannot be seen. */
export default async function ScoringSheetPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sheet = await getScoringSheet(id);
  if (!sheet) notFound();

  return <SheetDetail sheet={sheet} />;
}

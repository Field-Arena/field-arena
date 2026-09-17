import { redirect } from 'next/navigation';

export default async function DocumentsPage({
  searchParams,
}: {
  searchParams: Promise<{ show?: string }>;
}) {
  const { show } = await searchParams;
  redirect(`/dashboard/documents/entry-ledger${show ? `?show=${show}` : ''}`);
}

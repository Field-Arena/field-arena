import type { Metadata } from 'next';
import { listContacts } from '@/modules/superadmin/data/queries';
import { SalesCrm } from '@/modules/superadmin/ui/sales-crm';

export const metadata: Metadata = {
  title: 'Sales Pipeline — SuperAdmin Console',
};

export default async function SalesPipelinePage() {
  const contacts = await listContacts();
  return <SalesCrm contacts={contacts} />;
}

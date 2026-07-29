import type { Metadata } from 'next';
import { TermsOfServiceContent } from '@/modules/marketing/content/legal';

export const metadata: Metadata = {
  title: 'Terms of Service | Field & Arena',
  description: 'Field & Arena Terms of Service.',
  robots: { index: false },
};

export default function TermsOfServicePage() {
  return <TermsOfServiceContent />;
}

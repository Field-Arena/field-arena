import type { Metadata } from 'next';
import { TermsOfServiceContent } from '@/modules/marketing/content/legal/terms-of-service-content';

export const metadata: Metadata = {
  title: 'Terms of Service | Field & Arena',
  description: 'Field & Arena Terms of Service.',
  robots: { index: false },
};

export default function TermsOfServicePage() {
  return <TermsOfServiceContent />;
}

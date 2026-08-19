import type { Metadata } from 'next';
import { PrivacyPolicyContent } from '@/modules/marketing/content/legal/privacy-policy-content';

export const metadata: Metadata = {
  title: 'Privacy Policy | Field & Arena',
  description: 'How Field & Arena collects, uses, and protects your information.',
  robots: { index: false },
};

export default function PrivacyPolicyPage() {
  return <PrivacyPolicyContent />;
}

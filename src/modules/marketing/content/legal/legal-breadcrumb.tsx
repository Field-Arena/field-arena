import Link from 'next/link';
import type { ReactElement } from 'react';
import { ROUTES } from '@/shared/constants/routes';
import { BREADCRUMB_SEPARATOR } from '@/modules/marketing/constants';

export function LegalBreadcrumb({ label }: { label: string }): ReactElement {
  return (
    <>
      <Link href={ROUTES.home}>Home</Link>
      {BREADCRUMB_SEPARATOR}
      {label}
    </>
  );
}

import Link from 'next/link';
import type { ReactElement } from 'react';
import { ROUTES } from '@/shared/constants/routes';
import { BREADCRUMB_SEPARATOR, LEARNING_CENTER_ROUTE } from '@/modules/marketing/constants';

export function GuideBreadcrumb({ label }: { label: string }): ReactElement {
  return (
    <>
      <Link href={ROUTES.home}>Home</Link>
      {BREADCRUMB_SEPARATOR}
      <Link href={LEARNING_CENTER_ROUTE}>Learning Center</Link>
      {BREADCRUMB_SEPARATOR}
      {label}
    </>
  );
}

import { ConsolePageSkeleton } from '@/shared/ui/console-skeletons';

/**
 * Shown while any SuperAdmin console page streams — the overview, users, sales,
 * catalog, documents, and billing all share the header + tiles + table shape, so
 * one skeleton covers them. Segments with a different shape (the lead detail
 * page) ship their own loading.tsx.
 */
export default function SuperAdminLoading() {
  return <ConsolePageSkeleton />;
}

import { resolveTimeZone, todayInZone } from '@/shared/lib/format/time-zone';
import type { Metadata } from 'next';
import { listMyAssignments, getPreviewShowName } from '@/modules/judging/data/queries';
import { getStaffProfile } from '@/shared/lib/auth/session';
import { buildDemoAssignments } from '@/modules/judging/utils/build-demo-assignments';
import { JUDGING_REFERENCE_DOCS, USDF_TEST_SHEETS_URL } from '@/modules/judging/constants';
import { classifyAssignment } from '@/modules/judging/utils/classify-assignment';
import { SuperAdminPreviewNotice } from '@/modules/judging/ui/superadmin-preview-notice';

export const metadata: Metadata = { title: 'Documents — Field & Arena' };

export default async function JudgingDocumentsPage() {
  // Demo rows only; real rows carry today in their own show's timezone.
  const demoTodayIso = todayInZone(resolveTimeZone());
  const [profile, realAssignments] = await Promise.all([getStaffProfile(), listMyAssignments()]);
  const isSuperAdminPreview = profile?.platform_role === 'SuperAdmin';
  // Real rows come back whenever a show is being previewed; the demo builders
  // are the fallback for a SuperAdmin who hasn't picked one.
  const previewShowName = isSuperAdminPreview ? await getPreviewShowName() : null;
  const useDemoData = isSuperAdminPreview && previewShowName === null;
  const assignments = useDemoData ? buildDemoAssignments(demoTodayIso) : realAssignments;
  // One test sheet per class still ahead of you (today or later), deduped by
  // test — the same sheet across two shows is one download.
  const sheets = [
    ...new Map(
      assignments
        .filter((a) => classifyAssignment(a) !== 'history')
        .map((a) => [a.classLabel, a] as const),
    ).values(),
  ];

  return (
    <section>
      <div className="fa-page-head">
        <div>
          <h2>Documents</h2>
          <p>Test sheets, directives, and rule references for your assignments.</p>
        </div>
      </div>

      {isSuperAdminPreview && <SuperAdminPreviewNotice showName={previewShowName} />}

      <h3 className="mb-3 text-[15px] font-semibold tracking-[-.2px] text-[var(--fa-ink)]">
        Your test sheets
      </h3>
      {sheets.length === 0 ? (
        <div className="fa-mini-card mb-7">
          <p>No upcoming classes — test sheets show up here once you&apos;re on a panel.</p>
        </div>
      ) : (
        <div className="fa-grid2 mb-7">
          {sheets.map((a) => (
            <a
              key={a.classLabel}
              href={USDF_TEST_SHEETS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="fa-mini-card no-underline transition hover:shadow-[var(--fa-shadow-md)]"
            >
              <h4>{a.classLabel} ↗</h4>
              <p>Official test sheet · {a.showName}</p>
            </a>
          ))}
        </div>
      )}

      <h3 className="mb-3 text-[15px] font-semibold tracking-[-.2px] text-[var(--fa-ink)]">
        References
      </h3>
      <div className="fa-grid2">
        {JUDGING_REFERENCE_DOCS.map((doc) => (
          <a
            key={doc.name}
            href={doc.url}
            target="_blank"
            rel="noopener noreferrer"
            className="fa-mini-card no-underline transition hover:shadow-[var(--fa-shadow-md)]"
          >
            <h4>{doc.name} ↗</h4>
            <p>{doc.detail}</p>
          </a>
        ))}
      </div>
    </section>
  );
}

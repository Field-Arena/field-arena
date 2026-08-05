/**
 * Shown when a SuperAdmin reaches this workspace from the console's ROLES
 * rail preview links (`role-rail.tsx`). That rail is a plain navigation —
 * no impersonation happens — so a SuperAdmin has no real panel assignments
 * of their own. Rather than a literal empty page, the surrounding pages
 * substitute the design's own demo data (see DEMO_JUDGE_NAME in
 * constants.ts) — matching legacy platform.html's Judge/Scribe rail preview,
 * which showed the same kind of hardcoded example judge for this exact
 * reason. This banner is what makes that example data legible as example
 * data rather than a real person's real panel.
 */
export function SuperAdminPreviewNotice() {
  return (
    <div className="mb-6 rounded-[10px] border border-[#EAD9A0] bg-[#FBF0D8] px-4 py-3 text-[13px] text-[#5A4413]">
      <strong className="font-semibold">Previewing this workspace as SuperAdmin.</strong> The
      assignments and panel below are example data, showing what a judge or scribe sees — not
      tied to a real account.
    </div>
  );
}

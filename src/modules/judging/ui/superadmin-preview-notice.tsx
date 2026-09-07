import Link from 'next/link';

/* Two very different states, and conflating them is the whole point of this
 * component: with a show selected the screen below is that show's REAL panel
 * and entries (legacy's "Judge · <show>"); with none selected it is example
 * data. Fabricated numbers shown inside the same chrome as a real view, with
 * nothing saying which you are looking at, is precisely the trap the legacy
 * console called out and fixed for its own riders roster. */
export function SuperAdminPreviewNotice({ showName = null }: { showName?: string | null }) {
  if (showName) {
    return (
      <div className="mb-6 rounded-[10px] border border-[#C6DECD] bg-[#EAF4EE] px-4 py-3 text-[13px] text-[#1F4A34]">
        <strong className="font-semibold">Previewing {showName} as SuperAdmin.</strong> Everything
        below is this show&rsquo;s real panel and entries, exactly as its judges and scribes see it.{' '}
        <Link href="/dashboard/superadmin" className="underline underline-offset-2">
          Back to the console
        </Link>
        .
      </div>
    );
  }

  return (
    <div className="mb-6 rounded-[10px] border border-[#EAD9A0] bg-[#FBF0D8] px-4 py-3 text-[13px] text-[#5A4413]">
      <strong className="font-semibold">Previewing this workspace as SuperAdmin.</strong> The
      assignments and panel below are example data, not a real account. Pick a show from an{' '}
      <Link href="/dashboard/superadmin" className="underline underline-offset-2">
        organizer&rsquo;s show list
      </Link>{' '}
      to preview it against real entries instead.
    </div>
  );
}

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
      <div className="mb-4 rounded-[14px] border-[1.5px] border-[#1A5B3C] bg-[#E9F4EE] px-4 py-3 text-[13.5px] text-[#0D2C23]">
        <strong className="font-bold">Previewing {showName} as SuperAdmin.</strong> Everything below
        is this show&rsquo;s real panel and entries, exactly as its judges and scribes see it.{' '}
        <Link
          href="/dashboard/superadmin"
          prefetch={false}
          className="underline underline-offset-2"
        >
          Back to the console
        </Link>
        .
      </div>
    );
  }

  return (
    <div className="mb-4 rounded-[14px] border-[1.5px] border-[#E3C877] bg-[#FCF3E4] px-4 py-3 text-[13.5px] text-[#5A4413]">
      <strong className="font-bold">Previewing this workspace as SuperAdmin.</strong> The
      assignments and panel below are example data, not a real account. Pick a show from an{' '}
      <Link href="/dashboard/superadmin" prefetch={false} className="underline underline-offset-2">
        organizer&rsquo;s show list
      </Link>{' '}
      to preview it against real entries instead.
    </div>
  );
}

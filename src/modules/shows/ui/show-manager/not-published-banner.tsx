export function NotPublishedBanner({ reason }: { reason: string | null }) {
  return (
    <div className="rounded-[10px] border border-l-[3px] border-[#E7EAEE] border-l-[#B42318] bg-white px-[18px] py-4">
      <p className="text-[13.5px] text-[#101828]">
        <strong>Not published</strong> — riders can&apos;t see this show or buy tickets yet.
      </p>
      {reason && <p className="mt-1 text-[12.5px] text-[#B42318] italic">{reason}</p>}
    </div>
  );
}

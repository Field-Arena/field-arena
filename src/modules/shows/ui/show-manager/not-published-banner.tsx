export function NotPublishedBanner({ reason }: { reason: string | null }) {
  return (
    <div className="rounded-[10px] border border-l-[3px] border-[#E9EDEB] border-l-[#B4432F] bg-white px-[18px] py-4">
      <p className="text-ink-deep text-[13.5px]">
        <strong>Not published</strong> — riders can&apos;t see this show or buy tickets yet.
      </p>
      {reason && <p className="mt-1 text-[12.5px] text-[#B4432F] italic">{reason}</p>}
    </div>
  );
}

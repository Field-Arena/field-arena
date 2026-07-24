export function VideoSection() {
  return (
    <section id="video" className="relative z-20 -mt-[30px] px-6">
      <div className="relative mx-auto flex aspect-video max-w-[820px] items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-[#0f1d16] shadow-[0_30px_70px_rgba(15,29,22,0.35)]">
        <div className="flex flex-col items-center gap-3.5 text-white">
          <span className="flex h-[66px] w-[66px] items-center justify-center rounded-full border-[1.5px] border-white/50 bg-white/15">
            <svg viewBox="0 0 24 24" fill="currentColor" className="ml-[3px] h-[22px] w-[22px]">
              <path d="M8 5v14l11-7z" />
            </svg>
          </span>
          <span className="text-[13px] font-semibold">See Field &amp; Arena run a real show</span>
        </div>
      </div>
      <p className="text-ink-soft mt-3.5 text-center text-[12.5px]">
        2-minute walkthrough — no video uploaded yet in this preview.
      </p>
    </section>
  );
}

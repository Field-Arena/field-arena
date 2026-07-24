export function HeroSection() {
  return (
    <section className="bg-hunter relative overflow-hidden px-6 pt-[76px] pb-[60px] text-center text-white">
      {/* faint dressage arena outline */}
      <svg
        className="pointer-events-none absolute top-[52%] left-1/2 h-[520px] w-[900px] -translate-x-1/2 -translate-y-1/2 opacity-10"
        viewBox="0 0 900 520"
        aria-hidden="true"
      >
        <rect x="70" y="70" width="760" height="380" fill="none" stroke="#fff" strokeWidth="1.5" />
        <g fontFamily="var(--font-fraunces), serif" fontSize="20" fill="#fff" textAnchor="middle">
          <text x="450" y="435">A</text>
          <text x="95" y="337">K</text>
          <text x="95" y="265">E</text>
          <text x="95" y="193">H</text>
          <text x="450" y="100">C</text>
          <text x="805" y="193">M</text>
          <text x="805" y="265">B</text>
          <text x="805" y="337">F</text>
        </g>
      </svg>

      <div className="relative z-10 mx-auto max-w-[680px]">
        <span className="text-gold mb-4 inline-block text-[11.5px] font-bold tracking-[1.6px] uppercase">
          Show management, built by people who&apos;ve run shows
        </span>
        <h1 className="font-[family-name:var(--font-fraunces)] mb-[18px] text-[clamp(34px,5.2vw,54px)] leading-[1.06] font-semibold tracking-[-0.015em]">
          Run the Whole Show.
          <br />
          Not <em className="text-gold not-italic italic">Six</em> of Them.
        </h1>
        <p className="mx-auto mb-[30px] max-w-[520px] text-[16.5px] leading-relaxed text-[#cbdace]">
          Entries, scoring, staffing, and payouts — one system, instead of a spreadsheet, a PDF test
          sheet, a group text, and a Venmo trail.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <a
            href="#demo"
            className="bg-gold text-hunter rounded-[9px] px-6 py-3.5 text-[14.5px] font-bold hover:bg-white"
          >
            Book a demo
          </a>
          <a
            href="#video"
            className="rounded-[9px] border-[1.5px] border-white/40 px-[22px] py-[13px] text-[14.5px] font-semibold text-white hover:border-white"
          >
            Watch 2 minutes
          </a>
        </div>
      </div>
    </section>
  );
}

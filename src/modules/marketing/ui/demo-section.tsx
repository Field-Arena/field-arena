import { DEMO_POINTS } from '../constants';

export function DemoSection() {
  return (
    <section id="demo" className="px-6 pt-[70px] pb-[90px]">
      <div className="border-line mx-auto flex max-w-[900px] flex-wrap overflow-hidden rounded-[20px] border bg-white shadow-[0_20px_50px_rgba(31,58,46,0.06)]">
        <div className="bg-hunter min-w-[280px] flex-1 px-9 py-10 text-white">
          <span className="text-gold mb-4 inline-block text-[11.5px] font-bold tracking-[1.6px] uppercase">
            Book a demo
          </span>
          <h2 className="font-[family-name:var(--font-fraunces)] mb-3.5 text-[26px] font-semibold tracking-[-0.01em]">
            See Your Actual Show,
            <br />
            Not a Canned One
          </h2>
          <p className="mb-[22px] text-[13.5px] leading-relaxed text-[#c7d6cc]">
            15 minutes. Bring your last omnibus or prize list and we&apos;ll show you exactly how it
            becomes a live show in Field &amp; Arena.
          </p>
          <ul className="flex list-none flex-col gap-3">
            {DEMO_POINTS.map((point) => (
              <li key={point} className="flex items-start gap-2.5 text-[13px] text-[#dce7df]">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-gold mt-0.5 h-[15px] w-[15px] flex-none"
                >
                  <path d="M20 6L9 17l-5-5" />
                </svg>
                {point}
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-cream min-w-[320px] flex-[1.2] p-7">
          <div className="border-line flex h-[480px] min-w-[280px] items-center justify-center overflow-hidden rounded-xl border bg-white">
            <div className="text-ink-soft px-8 text-center text-[13px] leading-relaxed">
              <b className="font-[family-name:var(--font-fraunces)] text-hunter mb-1.5 block text-[15px]">Scheduling goes here</b>
              Connect your booking link and this becomes a live picker.
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

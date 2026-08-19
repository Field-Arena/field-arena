import Link from 'next/link';
import { CheckIcon } from 'lucide-react';
import { AUTH_ASIDE_POINTS, AUTH_ASIDE_QUOTE } from '@/modules/auth/constants';

export function AuthAside() {
  return (
    <aside className="bg-forest relative hidden flex-col overflow-hidden px-14 pt-12 pb-13 lg:flex">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(110%_80%_at_78%_6%,rgba(201,162,39,.20)_0%,rgba(13,44,35,0)_58%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-[300px] bg-[repeating-linear-gradient(90deg,rgba(255,255,255,.045)_0_1px,transparent_1px_88px)]"
      />

      <Link href="/" className="text-paper relative flex items-center gap-[11px]">
        <span className="bg-gold text-forest grid size-[34px] place-items-center rounded-lg font-[family-name:var(--font-nr)] text-[15px] font-semibold tracking-[-.02em]">
          F&amp;A
        </span>
        <span className="font-[family-name:var(--font-nr)] text-[19px] font-medium tracking-[-.01em]">
          Field &amp; Arena
        </span>
      </Link>

      <div className="relative my-auto max-w-[430px]">
        <div className="mb-[30px] inline-flex items-center gap-2.5 rounded-full border border-[rgba(201,162,39,.42)] py-[7px] pr-3.5 pl-[11px]">
          <span
            aria-hidden
            className="fa-motion bg-gold size-1.5 [animation:fa-pulse_2s_ease-in-out_infinite] rounded-full"
          />
          <span className="text-gold-light text-[10.5px] font-bold tracking-[.18em] uppercase">
            One account, every show
          </span>
        </div>

        <h2 className="text-paper mb-[22px] font-[family-name:var(--font-nr)] text-[50px] leading-none font-medium tracking-[-.024em] text-pretty">
          Run your entire event from <em className="text-gold-light italic">one</em> account.
        </h2>

        <p className="mb-[34px] text-base leading-[1.62] text-[rgba(251,250,247,.62)]">
          Organizer, official, staff, or rider — one login, the right workspace. Set it up in under
          a minute.
        </p>

        <ul className="flex list-none flex-col gap-3.5 border-t border-[rgba(255,255,255,.12)] p-0 pt-7">
          {AUTH_ASIDE_POINTS.map((point) => (
            <li key={point} className="flex items-start gap-[11px]">
              <CheckIcon
                className="text-gold mt-[3px] size-[15px] flex-none [stroke-width:2.6]"
                aria-hidden
              />
              <span className="text-sm leading-normal text-[rgba(251,250,247,.7)]">{point}</span>
            </li>
          ))}
        </ul>
      </div>

      <figure className="border-gold relative m-0 max-w-[460px] border-l-[3px] py-1 pl-[22px]">
        <blockquote className="m-0 mb-3 font-[family-name:var(--font-nr)] text-xl leading-[1.42] font-light tracking-[-.008em] text-[rgba(251,250,247,.9)] italic">
          {AUTH_ASIDE_QUOTE}
        </blockquote>
        <figcaption className="text-gold text-[10px] font-bold tracking-[.18em] uppercase">
          Field &amp; Arena product principle
        </figcaption>
      </figure>
    </aside>
  );
}

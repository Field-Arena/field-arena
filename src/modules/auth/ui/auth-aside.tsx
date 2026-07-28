import Link from 'next/link';
import { CheckIcon } from 'lucide-react';
import { AUTH_ASIDE_POINTS, AUTH_ASIDE_QUOTE } from '../constants';

/**
 * The forest panel beside the auth forms.
 *
 * Server-rendered — it is static marketing copy with two CSS-only decorative
 * layers and no interactivity, so nothing here needs to ship to the client.
 * Hidden below lg, where the form takes the full width rather than being
 * squeezed beside a panel nobody reads on a phone.
 */
export function AuthAside() {
  return (
    <aside className="relative hidden flex-col overflow-hidden bg-forest px-14 pb-13 pt-12 lg:flex">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(110%_80%_at_78%_6%,rgba(201,162,39,.20)_0%,rgba(13,44,35,0)_58%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-[300px] bg-[repeating-linear-gradient(90deg,rgba(255,255,255,.045)_0_1px,transparent_1px_88px)]"
      />

      <Link href="/" className="relative flex items-center gap-[11px] text-paper">
        <span className="grid size-[34px] place-items-center rounded-lg bg-gold font-[family-name:var(--font-nr)] text-[15px] font-semibold tracking-[-.02em] text-forest">
          F&amp;A
        </span>
        <span className="font-[family-name:var(--font-nr)] text-[19px] font-medium tracking-[-.01em]">
          Field &amp; Arena
        </span>
      </Link>

      <div className="relative my-auto max-w-[430px]">
        <div className="mb-[30px] inline-flex items-center gap-2.5 rounded-full border border-[rgba(201,162,39,.42)] py-[7px] pl-[11px] pr-3.5">
          <span
            aria-hidden
            className="fa-motion size-1.5 rounded-full bg-gold [animation:fa-pulse_2s_ease-in-out_infinite]"
          />
          <span className="text-[10.5px] font-bold uppercase tracking-[.18em] text-gold-light">
            One account, every show
          </span>
        </div>

        <h2 className="mb-[22px] text-pretty font-[family-name:var(--font-nr)] text-[50px] font-medium leading-none tracking-[-.024em] text-paper">
          Run your entire event from <em className="italic text-gold-light">one</em> account.
        </h2>

        <p className="mb-[34px] text-base leading-[1.62] text-[rgba(251,250,247,.62)]">
          Organizer, official, staff, or rider — one login, the right workspace. Set it up in under
          a minute.
        </p>

        <ul className="flex list-none flex-col gap-3.5 border-t border-[rgba(255,255,255,.12)] p-0 pt-7">
          {AUTH_ASIDE_POINTS.map((point) => (
            <li key={point} className="flex items-start gap-[11px]">
              <CheckIcon
                className="mt-[3px] size-[15px] flex-none text-gold [stroke-width:2.6]"
                aria-hidden
              />
              <span className="text-sm leading-normal text-[rgba(251,250,247,.7)]">{point}</span>
            </li>
          ))}
        </ul>
      </div>

      <figure className="relative m-0 max-w-[460px] border-l-[3px] border-gold py-1 pl-[22px]">
        <blockquote className="m-0 mb-3 font-[family-name:var(--font-nr)] text-xl font-light italic leading-[1.42] tracking-[-.008em] text-[rgba(251,250,247,.9)]">
          {AUTH_ASIDE_QUOTE}
        </blockquote>
        <figcaption className="text-[10px] font-bold uppercase tracking-[.18em] text-gold">
          Field &amp; Arena product principle
        </figcaption>
      </figure>
    </aside>
  );
}

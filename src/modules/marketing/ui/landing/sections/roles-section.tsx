import { Eyebrow } from '@/modules/marketing/ui/landing/sections/eyebrow';
import { gridDividerClasses } from '@/modules/marketing/utils';
import { ROLES } from '@/modules/marketing/landing-content';

const DISPLAY = 'font-[family-name:var(--font-nr)]';
const H2 = `${DISPLAY} text-[32px] font-medium leading-[1.04] tracking-[-.022em] md:text-[42px] xl:text-[50px]`;
const SECTION = 'px-5 py-[72px] md:px-8 lg:px-10 lg:py-28';

export function RolesSection() {
  return (
    <section id="roles" className={`bg-paper ${SECTION}`}>
      <div className="mx-auto max-w-[1240px]">
        <div className="mb-14 max-w-[700px]">
          <Eyebrow>Designed around real roles</Eyebrow>
          <h2 className={`m-0 ${H2} text-forest`}>
            One platform, with the right workspace for each person.
          </h2>
        </div>

        <div className="border-line grid grid-cols-1 overflow-hidden rounded-[14px] border bg-white sm:grid-cols-2 lg:grid-cols-3">
          {ROLES.map((role, index) => (
            <article
              key={role.title}
              className={`border-line px-7 py-8 transition-colors duration-150 hover:bg-[#F4F8F6] ${gridDividerClasses(index, ROLES.length, { base: 1, sm: 2, lg: 3 })}`}
            >
              <h3 className="text-forest mb-2.5 text-base leading-[normal] font-bold">
                {role.title}
              </h3>
              <p className="text-fa-muted m-0 text-[13.5px] leading-[1.6]">{role.body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

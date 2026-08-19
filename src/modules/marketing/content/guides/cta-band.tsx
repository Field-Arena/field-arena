import type { ReactElement } from 'react';
import { DemoLink } from '@/modules/marketing/content/guides/demo-link';

export function CtaBand({
  heading,
  body,
  cta,
}: {
  heading: string;
  body: string;
  cta: string;
}): ReactElement {
  return (
    <section className="border-line-mint bg-mint mt-14 rounded-[14px] border px-7 py-10 text-center">
      <h2 className="text-forest mt-0 mb-3 font-[family-name:var(--font-nr)] text-[26px] font-medium">
        {heading}
      </h2>
      <p className="text-ink-lead mx-auto mb-6 max-w-[520px] text-[15px] leading-[1.65]">{body}</p>
      <DemoLink>{cta}</DemoLink>
    </section>
  );
}

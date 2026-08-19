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
    <section className="mt-14 rounded-[14px] border border-line-mint bg-mint px-7 py-10 text-center">
      <h2 className="mb-3 mt-0 font-[family-name:var(--font-nr)] text-[26px] font-medium text-forest">
        {heading}
      </h2>
      <p className="mx-auto mb-6 max-w-[520px] text-[15px] leading-[1.65] text-ink-lead">{body}</p>
      <DemoLink>{cta}</DemoLink>
    </section>
  );
}

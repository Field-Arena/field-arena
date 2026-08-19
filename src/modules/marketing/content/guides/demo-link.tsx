import type { ReactElement, ReactNode } from 'react';
import { DemoTrigger } from '@/modules/marketing/ui/landing/demo-trigger';

/**
 * Every call to action in the guides opens the demo dialog, the same as the ones
 * on the landing page. The ported version pointed at "/" — the home page — which
 * dropped a reader who had just finished a guide back at the top of the site
 * with nothing asked of them.
 *
 * `no-underline` is explicit: the prose styling in ArticleShell underlines links
 * in gold, which is right for a link inside a sentence and wrong for a button.
 */
export function DemoLink({ children }: { children: ReactNode }): ReactElement {
  return (
    <DemoTrigger className="inline-flex items-center gap-2.5 rounded-[10px] bg-gold px-6 py-3.5 text-[14.5px] font-bold text-forest no-underline transition-all duration-150 hover:-translate-y-0.5 hover:bg-gold-light hover:text-forest hover:shadow-[0_12px_34px_rgba(201,162,39,.28)]">
      {children}
    </DemoTrigger>
  );
}

import { Suspense, type ReactNode } from 'react';
import { LandingNav, LandingFooter } from './landing/chrome';
import { DemoDialogMount } from './landing/demo-dialog-mount';
import { LoginDialog } from '@/modules/auth/ui/login-dialog';

/**
 * Shell for the long-form marketing pages — the Learning Center guides and the
 * legal documents.
 *
 * The bodies are plain semantic HTML (h2, p, ul, hr, strong) carried over
 * unchanged, so this styles them with descendant selectors rather than asking
 * 1,600 lines of prose to grow class attributes. That is what keeps the content
 * portable: it stays readable markup and the presentation lives in one place.
 *
 * Same nav and footer as the landing page on purpose. Two different headers on
 * one site reads as two different sites.
 */
const PROSE = [
  // Rhythm
  '[&_p]:mb-5 [&_p]:text-[15.5px] [&_p]:leading-[1.7] [&_p]:text-ink-lead',
  '[&_h2]:mb-4 [&_h2]:mt-12 [&_h2]:font-[family-name:var(--font-nr)] [&_h2]:text-[28px] [&_h2]:font-medium [&_h2]:leading-[1.15] [&_h2]:tracking-[-.018em] [&_h2]:text-forest',
  '[&_h3]:mb-3 [&_h3]:mt-8 [&_h3]:text-[17px] [&_h3]:font-bold [&_h3]:text-forest',
  // Lists
  '[&_ul]:mb-5 [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-5',
  '[&_ol]:mb-5 [&_ol]:list-decimal [&_ol]:space-y-2 [&_ol]:pl-5',
  '[&_li]:text-[15.5px] [&_li]:leading-[1.65] [&_li]:text-ink-lead',
  '[&_li::marker]:text-gold',
  // Emphasis and rules
  '[&_strong]:font-bold [&_strong]:text-forest',
  '[&_hr]:my-10 [&_hr]:border-line',
  '[&_a]:font-semibold [&_a]:text-forest [&_a]:underline [&_a]:decoration-gold [&_a]:underline-offset-4',
  '[&_a:hover]:text-gold',
].join(' ');

interface ArticleShellProps {
  eyebrow: string;
  title: string;
  lede: string;
  breadcrumb: ReactNode;
  subhead?: string;
  ctaRow?: ReactNode;
  variant?: 'guide' | 'legal';
  children: ReactNode;
}

export function ArticleShell({
  eyebrow,
  title,
  lede,
  breadcrumb,
  subhead,
  ctaRow,
  children,
}: ArticleShellProps) {
  return (
    <div className="fa-public bg-paper font-[family-name:var(--font-ar)] text-ink-deep">
      <LandingNav />

      <main className="px-5 pb-20 pt-10 md:px-8 lg:px-10">
        <div className="mx-auto max-w-[760px]">
          <nav
            aria-label="Breadcrumb"
            className="mb-8 text-[12.5px] text-fa-muted-2 [&_a:hover]:text-gold [&_a]:text-forest"
          >
            {breadcrumb}
          </nav>

          <div className="mb-3 text-[10.5px] font-bold uppercase tracking-[.18em] text-gold">
            {eyebrow}
          </div>
          <h1 className="mb-4 text-pretty font-[family-name:var(--font-nr)] text-[34px] font-medium leading-[1.06] tracking-[-.022em] text-forest md:text-[42px]">
            {title}
          </h1>
          {subhead !== undefined && (
            <p className="mb-4 text-[18px] leading-[1.5] text-forest">{subhead}</p>
          )}
          <p className="mb-8 text-[16px] leading-[1.65] text-ink-lead">{lede}</p>
          {ctaRow !== undefined && <div className="mb-12 flex flex-wrap gap-3">{ctaRow}</div>}

          <div className={PROSE}>{children}</div>
        </div>
      </main>

      <LandingFooter />
      <Suspense>
        <DemoDialogMount />
      </Suspense>
      <LoginDialog />
    </div>
  );
}

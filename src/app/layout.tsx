import type { Metadata } from 'next';
import { Archivo, Fraunces, Inter, Newsreader } from 'next/font/google';
import NextTopLoader from 'nextjs-toploader';
import './globals.css';
import { QueryProvider } from '@/providers/query-provider';
import { Toaster } from '@/shared/ui/shadcn/sonner';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
});

const fraunces = Fraunces({
  variable: '--font-fraunces',
  subsets: ['latin'],
  weight: ['500', '600', '700'],
});

/**
 * Public-facing typography: Newsreader for editorial display type, Archivo for
 * UI and body. These are the landing / sign-up design's faces and are separate
 * from Inter + Fraunces, which the workspace still uses.
 *
 * The CSS variable names are deliberately NOT --font-newsreader/--font-archivo:
 * globals.css maps the Tailwind theme tokens --font-[family-name:var(--font-nr)] and --font-[family-name:var(--font-ar)] onto
 * these, and a token that referenced a variable of its own name would be
 * circular and silently resolve to nothing.
 */
/**
 * Newsreader is loaded as the *variable* font — no `weight` array — because the
 * design reference loads it that way (`ital,opsz,wght@0,6..72,300..700`) and the
 * optical-size axis changes glyph widths at display sizes. Pinning static
 * instances narrowed the italic: the hero's italic "one" measured 104px instead
 * of 109px, which was enough to pull "modern" up a line and re-wrap the H1 away
 * from the reference. `opsz` must be listed explicitly; next/font only carries
 * `wght` automatically.
 */
const newsreader = Newsreader({
  variable: '--font-nr',
  subsets: ['latin'],
  style: ['normal', 'italic'],
  axes: ['opsz'],
});

const archivo = Archivo({
  variable: '--font-ar',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
});

export const metadata: Metadata = {
  title: 'Field & Arena — Run the whole show, not six of them',
  description:
    'Entries, scoring, staffing, and payouts for equestrian shows — one system instead of six.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // data-scroll-behavior mirrors the `scroll-behavior: smooth` rule in
  // globals.css, which the landing page's anchor nav relies on. Without the
  // attribute Next.js cannot tell that the smooth scrolling is deliberate, so it
  // leaves it on during route transitions — a page change then animates a long
  // scroll instead of landing at the top.
  return (
    // The four font variables sit on <html>, not <body>. globals.css declares
    // --sans and --serif in :root as `var(--font-inter), …` / `var(--font-fraunces), …`,
    // and a custom property substitutes at its declaration site — so with the
    // variables on <body> those references resolved against :root, found
    // nothing, and left `font-family` invalid. Every workspace page fell back to
    // the browser default serif (Times New Roman) for anything without its own
    // font utility.
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${inter.variable} ${fraunces.variable} ${newsreader.variable} ${archivo.variable}`}
    >
      <body suppressHydrationWarning className="antialiased">
        {/*
          Top navigation progress bar on every route change, in the brand forest
          green. Height and a subtle glow that reads on both the light dashboard
          and the dark public pages; the default spinner is off since the bar
          alone is enough and the route-level skeletons carry the rest.
        */}
        <NextTopLoader
          color="#0d2c23"
          height={3}
          showSpinner={false}
          shadow="0 0 10px #0d2c23,0 0 5px #0d2c23"
        />
        <QueryProvider>
          {children}
          <Toaster />
        </QueryProvider>
      </body>
    </html>
  );
}

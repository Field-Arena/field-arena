import type { Metadata } from 'next';
import { Archivo, Fraunces, Inter, Newsreader } from 'next/font/google';
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
const newsreader = Newsreader({
  variable: '--font-nr',
  subsets: ['latin'],
  weight: ['300', '500', '600'],
  style: ['normal', 'italic'],
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
    <html lang="en" data-scroll-behavior="smooth">
      <body
        suppressHydrationWarning
        className={`${inter.variable} ${fraunces.variable} ${newsreader.variable} ${archivo.variable} antialiased`}
      >
        <QueryProvider>
          {children}
          <Toaster />
        </QueryProvider>
      </body>
    </html>
  );
}

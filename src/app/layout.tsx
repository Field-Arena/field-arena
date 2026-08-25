import type { Metadata } from 'next';
import { Archivo, Fraunces, Inter, Newsreader } from 'next/font/google';
import NextTopLoader from 'nextjs-toploader';
import './globals.css';
import { QueryProvider } from '@/providers/query-provider';
import { Toaster } from '@/shared/ui/shadcn/sonner';
import { ScrollJumpButtons } from '@/shared/ui/scroll-jump-buttons';

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
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${inter.variable} ${fraunces.variable} ${newsreader.variable} ${archivo.variable}`}
    >
      <body suppressHydrationWarning className="antialiased">
        <NextTopLoader
          color="#0d2c23"
          height={3}
          showSpinner={false}
          shadow="0 0 10px #0d2c23,0 0 5px #0d2c23"
        />
        <QueryProvider>
          {children}
          <Toaster />
          <ScrollJumpButtons />
        </QueryProvider>
      </body>
    </html>
  );
}

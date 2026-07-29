import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { GUIDE_SLUGS, getGuide } from '@/modules/marketing/content/guides';

/**
 * Guides are static prose, so all nine are pre-rendered at build time.
 * `dynamicParams: false` makes any other slug a 404 instead of an attempt to
 * render a guide that does not exist.
 */
export const dynamicParams = false;

export function generateStaticParams() {
  return GUIDE_SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const guide = getGuide(slug);
  if (!guide) return {};

  return {
    title: `${guide.cardTitle} | Field & Arena`,
    description: guide.cardDescription,
  };
}

export default async function GuidePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const guide = getGuide(slug);
  if (!guide) notFound();

  const { Body } = guide;
  return <Body />;
}

import { Card } from '@/shared/ui/organizer/card';
import type { RiderEntriesData } from '@/modules/shows/data/setup-queries';
import { SM_CARD_PAD, SM_SECTION_HEAD } from '@/modules/shows/ui/show-manager/tokens';
import { BrandingSlot } from '@/modules/shows/ui/show-manager/branding-slot';

export function BrandingCard({ data }: { data: RiderEntriesData }) {
  const slots = [
    {
      kind: 'logo' as const,
      label: 'Logo',
      hint: 'Square · ticket page &amp; listings',
      prompt: 'Drop or click',
      url: data.logoUrl,
    },
    {
      kind: 'banner' as const,
      label: 'One-sheet / banner',
      hint: 'Runs wide across the ticket page',
      prompt: 'Drop or click — a flyer, venue photo, or past-show shot all work',
      url: data.bannerUrl,
    },
  ];

  return (
    <Card className={SM_CARD_PAD}>
      <h2 className={SM_SECTION_HEAD}>Branding</h2>
      <div className="grid gap-5 sm:grid-cols-[minmax(0,220px)_minmax(0,1fr)]">
        {slots.map((slot) => (
          <BrandingSlot key={slot.kind} showId={data.showId} {...slot} />
        ))}
      </div>
    </Card>
  );
}

import { SectionTitle, ScreenLede, Card } from '@/shared/ui/organizer/card';

export function StubPlaceholder({ label }: { label: string }) {
  return (
    <div className="font-[family-name:var(--font-ar)] text-[#101828]">
      <SectionTitle className="mb-1.5">{label}</SectionTitle>
      <ScreenLede className="mb-4">
        This part of the filing cabinet isn&apos;t built yet.
      </ScreenLede>
      <Card className="p-[18px_20px_20px]">
        <p className="py-8 text-center text-[13.5px] text-[#8A94A3] italic">Coming soon.</p>
      </Card>
    </div>
  );
}

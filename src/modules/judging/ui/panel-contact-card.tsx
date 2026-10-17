import type { PanelContact } from '@/modules/judging/data/queries';
import { CardTitle, FA_MUTED, FaCard, Pill } from '@/shared/ui/organizer/fa-page';

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? '';
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? '') : '';
  return (first + last).toUpperCase();
}

export function PanelContactCard({ contact }: { contact: PanelContact }) {
  const roleLabel = contact.role === 'judge' ? 'Judge' : 'Scribe';
  const detail = [
    contact.role === 'judge' && contact.position
      ? `${roleLabel} at ${contact.position}`
      : roleLabel,
    contact.showName,
  ].join(' · ');

  return (
    <FaCard className="flex items-center gap-4">
      <span className="grid size-11 flex-none place-items-center rounded-full bg-[#E9F4EE] font-[family-name:var(--ws-fraunces)] text-base font-bold text-[#1A5B3C]">
        {initials(contact.name)}
      </span>
      <span className="min-w-0 flex-1">
        <CardTitle className="text-[18px]">{contact.name}</CardTitle>
        <span className={`mt-0.5 block ${FA_MUTED}`}>{detail}</span>
      </span>
      <Pill tone={contact.role === 'judge' ? 'green' : 'blue'} className="flex-none">
        {roleLabel}
      </Pill>
    </FaCard>
  );
}

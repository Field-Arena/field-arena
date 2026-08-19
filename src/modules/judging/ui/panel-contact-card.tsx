import type { PanelContact } from '@/modules/judging/data/queries';

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? '';
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? '') : '';
  return (first + last).toUpperCase();
}

/** One row of the Panel & Contacts tab, ported from Judge Workspace.dc.html's `pc` card. */
export function PanelContactCard({ contact }: { contact: PanelContact }) {
  const roleLabel = contact.role === 'judge' ? 'Judge' : 'Scribe';
  const detail = [
    contact.role === 'judge' && contact.position ? `${roleLabel} at ${contact.position}` : roleLabel,
    contact.showName,
  ].join(' · ');

  return (
    <div className="flex items-center gap-4 rounded-xl border border-[#E9EDEB] bg-white p-[16px_20px]">
      <span className="grid size-11 flex-none place-items-center rounded-full bg-[#E7EFEA] font-[Newsreader,serif] text-base font-semibold text-[#2F5145]">
        {initials(contact.name)}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-[Newsreader,serif] text-lg font-semibold text-ink-deep">
          {contact.name}
        </span>
        <span className="mt-[3px] block text-[13.5px] text-[#5A6B63]">{detail}</span>
      </span>
    </div>
  );
}

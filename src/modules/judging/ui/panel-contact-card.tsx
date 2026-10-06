import type { PanelContact } from '@/modules/judging/types';

/** One official you share a panel with — the redesign's contact tile. */
export function PanelContactCard({ contact }: { contact: PanelContact }) {
  const roleLabel = contact.role === 'judge' ? 'Judge' : 'Scribe';
  const seat = contact.role === 'judge' && contact.position ? ` at ${contact.position}` : '';

  return (
    <div className="fa-mini-card">
      <h4>
        {contact.name} · {contact.license ?? roleLabel}
      </h4>
      <p>
        {roleLabel}
        {seat} · {contact.showName}.
      </p>
    </div>
  );
}

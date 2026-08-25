'use client';

import { useState } from 'react';
import { Button } from '@/shared/ui/shadcn/button';
import { Textarea } from '@/shared/ui/shadcn/textarea';
import type { LeadRow } from '@/modules/superadmin/types';
import { useUpdateLead } from '@/modules/superadmin/hooks/use-lead-mutations';
import { SECTION, H2, INPUT, SAVE } from '@/modules/superadmin/ui/lead-detail-styles';

export function NotesSection({ lead }: { lead: LeadRow }) {
  const [notes, setNotes] = useState(lead.notes ?? '');
  const update = useUpdateLead({ successMessage: 'Notes saved' });

  return (
    <section className={SECTION}>
      <h2 className={`${H2} mb-4`}>Notes</h2>
      <Textarea
        value={notes}
        onChange={(e) => {
          setNotes(e.target.value);
        }}
        placeholder="Call notes, objections, who else is involved in the decision…"
        className={`${INPUT} min-h-[132px] resize-y leading-[1.55]`}
      />
      <div className="mt-[18px]">
        <Button
          type="button"
          variant="ghost"
          disabled={update.isPending}
          className={`h-auto hover:bg-transparent ${SAVE}`}
          onClick={() => {
            update.mutate({ id: lead.id, notes });
          }}
        >
          {update.isPending ? 'Saving…' : 'Save notes'}
        </Button>
      </div>
    </section>
  );
}

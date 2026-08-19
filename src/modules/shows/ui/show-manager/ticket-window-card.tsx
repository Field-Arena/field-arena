'use client';

import { useState } from 'react';
import { Card } from '@/shared/ui/organizer/card';
import { Input } from '@/shared/ui/shadcn/input';
import { useUpdateTicketWindow } from '@/modules/shows/hooks/use-select-events-mutations';
import {
  SM_CARD_PAD,
  SM_SECTION_HEAD,
  SM_LABEL,
  SM_INPUT,
} from '@/modules/shows/ui/show-manager/tokens';
import type { SelectEventsData } from '@/modules/shows/data/setup-queries';

export function TicketWindowCard({ data }: { data: SelectEventsData }) {
  const [open, setOpen] = useState(data.ticketOpen);
  const [closeDate, setCloseDate] = useState(data.ticketCloseDate);
  const [closeTime, setCloseTime] = useState(data.ticketCloseTime);

  const { mutate } = useUpdateTicketWindow();

  function save(overrides: Partial<Record<string, string>> = {}) {
    mutate({
      showId: data.showId,
      ticketOpen: open,
      ticketCloseDate: closeDate,
      ticketCloseTime: closeTime,
      ...overrides,
    });
  }

  const windowDateFields: {
    id: string;
    label: string;
    value: string;
    onChange: (v: string) => void;
    onSave: () => void;
  }[] = [
    {
      id: 'ticket-open',
      label: 'Ticket sales open',
      value: open,
      onChange: setOpen,
      onSave: () => {
        save({ ticketOpen: open });
      },
    },
    {
      id: 'ticket-close-date',
      label: 'Ticket sales close (date)',
      value: closeDate,
      onChange: setCloseDate,
      onSave: () => {
        save({ ticketCloseDate: closeDate });
      },
    },
  ];

  return (
    <Card className={SM_CARD_PAD}>
      <h2 className={SM_SECTION_HEAD}>Ticket Sales Window</h2>

      <div className="grid gap-4 sm:grid-cols-2">
        {windowDateFields.map((f) => (
          <div key={f.id}>
            <label htmlFor={f.id} className={SM_LABEL}>
              {f.label}
            </label>
            <Input
              id={f.id}
              type="date"
              className={`h-auto ${SM_INPUT}`}
              value={f.value}
              onChange={(e) => {
                f.onChange(e.target.value);
              }}
              onBlur={f.onSave}
            />
          </div>
        ))}
      </div>

      <div className="mt-4 sm:max-w-[calc(50%-8px)]">
        <label htmlFor="ticket-close-time" className={SM_LABEL}>
          Ticket sales close (time)
        </label>
        <Input
          id="ticket-close-time"
          type="time"
          className={`h-auto ${SM_INPUT}`}
          value={closeTime}
          onChange={(e) => {
            setCloseTime(e.target.value);
          }}
          onBlur={() => {
            save({ ticketCloseTime: closeTime });
          }}
        />
      </div>
    </Card>
  );
}

'use client';

import { useState } from 'react';
import { Card } from '@/shared/ui/organizer/card';
import { Input } from '@/shared/ui/shadcn/input';
import { Label } from '@/shared/ui/shadcn/label';
import { useUpdateTicketWindow } from '@/modules/shows/hooks/use-select-events-mutations';
import {
  SM_CARD_PAD,
  SM_SECTION_HEAD,
  SM_LABEL,
  SM_INPUT,
} from '@/modules/shows/ui/show-manager/tokens';
import type { TicketWindowData } from '@/modules/shows/types';
import { updateTicketWindowSchema } from '@/modules/shows/schemas';
import { schemaFieldErrors } from '@/modules/shows/utils/schema-field-error';
import { FieldError } from '@/modules/shows/ui/field-error';

export function TicketWindowCard({ data }: { data: TicketWindowData }) {
  const [open, setOpen] = useState(data.ticketOpen);
  const [closeDate, setCloseDate] = useState(data.ticketCloseDate);
  const [closeTime, setCloseTime] = useState(data.ticketCloseTime);

  const { mutate } = useUpdateTicketWindow();

  const errors = schemaFieldErrors(updateTicketWindowSchema, {
    showId: data.showId,
    ticketOpen: open,
    ticketCloseDate: closeDate,
    ticketCloseTime: closeTime,
  });

  function save(overrides: Partial<Record<string, string>> = {}) {
    const payload = {
      showId: data.showId,
      ticketOpen: open,
      ticketCloseDate: closeDate,
      ticketCloseTime: closeTime,
      ...overrides,
    };
    if (!updateTicketWindowSchema.safeParse(payload).success) return;
    mutate(payload);
  }

  const windowDateFields: {
    id: string;
    label: string;
    value: string;
    error?: string;
    onChange: (v: string) => void;
    onSave: () => void;
  }[] = [
    {
      id: 'ticket-open',
      error: errors.ticketOpen,
      label: 'Ticket sales open',
      value: open,
      onChange: setOpen,
      onSave: () => {
        if (open !== data.ticketOpen) save({ ticketOpen: open });
      },
    },
    {
      id: 'ticket-close-date',
      error: errors.ticketCloseDate,
      label: 'Ticket sales close (date)',
      value: closeDate,
      onChange: setCloseDate,
      onSave: () => {
        if (closeDate !== data.ticketCloseDate) save({ ticketCloseDate: closeDate });
      },
    },
  ];

  return (
    <Card className={SM_CARD_PAD}>
      <h2 className={SM_SECTION_HEAD}>Ticket Sales Window</h2>

      <div className="grid gap-4 sm:grid-cols-2">
        {windowDateFields.map((f) => (
          <div key={f.id}>
            <Label htmlFor={f.id} className={SM_LABEL}>
              {f.label}
            </Label>
            <Input
              id={f.id}
              type="date"
              className={`h-auto ${SM_INPUT}`}
              value={f.value}
              max={f.id === 'ticket-open' ? closeDate || undefined : undefined}
              min={f.id === 'ticket-close-date' ? open || undefined : undefined}
              aria-invalid={f.error ? true : undefined}
              onChange={(e) => {
                f.onChange(e.target.value);
              }}
              onBlur={f.onSave}
            />
            <FieldError message={f.error} />
          </div>
        ))}
      </div>

      <div className="mt-4 sm:max-w-[calc(50%-8px)]">
        <Label htmlFor="ticket-close-time" className={SM_LABEL}>
          Ticket sales close (time)
        </Label>
        <Input
          id="ticket-close-time"
          type="time"
          className={`h-auto ${SM_INPUT}`}
          value={closeTime}
          onChange={(e) => {
            setCloseTime(e.target.value);
          }}
          onBlur={() => {
            if (closeTime !== data.ticketCloseTime) save({ ticketCloseTime: closeTime });
          }}
        />
        <FieldError message={errors.ticketCloseTime} />
      </div>
    </Card>
  );
}

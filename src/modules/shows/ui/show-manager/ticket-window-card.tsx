'use client';

import { useState } from 'react';
import { Card } from '@/shared/ui/organizer/card';
import { useUpdateTicketWindow } from '../../hooks/use-select-events-mutations';
import { SM_CARD_PAD, SM_SECTION_HEAD, SM_LABEL, SM_INPUT } from './tokens';
import type { SelectEventsData } from '../../data/setup-queries';

/**
 * "Ticket Sales Window" — when riders may enter.
 *
 * Autosaves on blur like the rest of the Setup cards, and sends all three
 * fields together: the close date and time are one column, so committing one
 * without the other would write half a value.
 */
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

  return (
    <Card className={SM_CARD_PAD}>
      <h2 className={SM_SECTION_HEAD}>Ticket Sales Window</h2>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="ticket-open" className={SM_LABEL}>
            Ticket sales open
          </label>
          <input
            id="ticket-open"
            type="date"
            className={SM_INPUT}
            value={open}
            onChange={(e) => {
              setOpen(e.target.value);
            }}
            onBlur={() => {
              save({ ticketOpen: open });
            }}
          />
        </div>

        <div>
          <label htmlFor="ticket-close-date" className={SM_LABEL}>
            Ticket sales close (date)
          </label>
          <input
            id="ticket-close-date"
            type="date"
            className={SM_INPUT}
            value={closeDate}
            onChange={(e) => {
              setCloseDate(e.target.value);
            }}
            onBlur={() => {
              save({ ticketCloseDate: closeDate });
            }}
          />
        </div>
      </div>

      <div className="mt-4 sm:max-w-[calc(50%-8px)]">
        <label htmlFor="ticket-close-time" className={SM_LABEL}>
          Ticket sales close (time)
        </label>
        <input
          id="ticket-close-time"
          type="time"
          className={SM_INPUT}
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

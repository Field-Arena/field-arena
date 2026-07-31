'use client';

import { useState } from 'react';
import { Card } from '@/shared/ui/organizer/card';
import { GhostButton } from '@/shared/ui/organizer/buttons';
import { useUpdatePrizeList } from '../../hooks/use-show-mutations';
import { SM_CARD_PAD, SM_SECTION_HEAD, SM_NOTE, SM_LABEL, SM_INPUT } from './tokens';

/** "Prize list" — one toggle-edit URL field, same recipe as Contact's rows. */
export function PrizeListCard({
  showId,
  prizeListUrl,
}: {
  showId: string;
  prizeListUrl: string | null;
}) {
  const [value, setValue] = useState(prizeListUrl ?? '');
  const [editing, setEditing] = useState(false);
  const { mutate } = useUpdatePrizeList();

  return (
    <Card className={SM_CARD_PAD}>
      <h2 className={SM_SECTION_HEAD}>Prize list</h2>
      <p className={SM_NOTE}>
        Paste a link to your prize list (a PDF, Google Doc, or any page riders can view). It shows
        up as a bold &ldquo;PRIZE LIST&rdquo; link at the top of your ticket page — riders can open
        it in place without leaving the site.
      </p>
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
        <div className="min-w-0">
          <span className={`${SM_LABEL} mb-1.5`}>Prize list URL</span>
          {editing ? (
            <input
              autoFocus
              type="url"
              value={value}
              placeholder="https://…"
              className={SM_INPUT}
              onChange={(e) => {
                setValue(e.target.value);
              }}
            />
          ) : (
            <div className="truncate text-[14.5px] text-ink-deep">
              {value || <span className="italic text-[#98A29D]">Not set</span>}
            </div>
          )}
        </div>
        <GhostButton
          className="px-3.5 py-2.5 text-[12.5px]"
          onClick={() => {
            if (editing) mutate({ showId, prizeListUrl: value });
            setEditing((v) => !v);
          }}
        >
          {editing ? 'Done' : 'Edit'}
        </GhostButton>
      </div>
    </Card>
  );
}

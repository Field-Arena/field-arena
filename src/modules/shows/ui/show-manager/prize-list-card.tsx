'use client';

import { useState } from 'react';
import { Card } from '@/shared/ui/organizer/card';
import { GhostButton } from '@/shared/ui/organizer/buttons';
import { Input } from '@/shared/ui/shadcn/input';
import { cn } from '@/shared/lib/utils';
import { useUpdatePrizeList } from '@/modules/shows/hooks/use-show-mutations';
import { updatePrizeListSchema } from '@/modules/shows/schemas';
import { schemaFieldError } from '@/modules/shows/utils/schema-field-error';
import { FieldError } from '@/modules/shows/ui/field-error';
import { URL_INPUT_PROPS } from '@/shared/lib/format/url-input';
import { SM_CARD_PAD, SM_NOTE, SM_LABEL, SM_INPUT } from '@/modules/shows/ui/show-manager/tokens';
import { SmHead } from './sm-head';

export function PrizeListCard({
  showId,
  prizeListUrl,
}: {
  showId: string;
  prizeListUrl: string | null;
}) {
  const [value, setValue] = useState(prizeListUrl ?? '');
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);
  const { mutate } = useUpdatePrizeList();

  return (
    <Card className={SM_CARD_PAD}>
      <SmHead icon="prize" title="Prize list" sub="A link riders can open from the ticket page" />
      <p className={SM_NOTE}>
        Paste a link to your prize list (a PDF, Google Doc, or any page riders can view). It shows
        up as a bold &ldquo;PRIZE LIST&rdquo; link at the top of your ticket page — riders can open
        it in place without leaving the site.
      </p>
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
        <div className="min-w-0">
          <span className={`${SM_LABEL} mb-1.5`}>Prize list URL</span>
          {editing ? (
            <>
              <Input
                autoFocus
                {...URL_INPUT_PROPS}
                maxLength={500}
                value={value}
                placeholder="https://…"
                aria-invalid={error ? true : undefined}
                className={cn('h-auto', SM_INPUT)}
                onChange={(e) => {
                  setValue(e.target.value);
                  setError(undefined);
                }}
              />
              <FieldError message={error} />
            </>
          ) : (
            <div className="truncate text-[14.5px] text-[#101828]">
              {value || <span className="text-[#8A94A3] italic">Not set</span>}
            </div>
          )}
        </div>
        <GhostButton
          className="px-3.5 py-2.5 text-[12.5px]"
          onClick={() => {
            if (editing) {
              const message = schemaFieldError(
                updatePrizeListSchema,
                { showId, prizeListUrl: value },
                'prizeListUrl',
              );
              if (message) {
                setError(message);
                return;
              }
              mutate({ showId, prizeListUrl: value });
            }
            setEditing((v) => !v);
          }}
        >
          {editing ? 'Done' : 'Edit'}
        </GhostButton>
      </div>
    </Card>
  );
}

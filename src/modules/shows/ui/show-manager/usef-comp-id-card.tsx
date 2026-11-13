'use client';

import { useState } from 'react';
import { FaCard, FA_INPUT } from '@/shared/ui/organizer/fa-page';
import { Label } from '@/shared/ui/shadcn/label';
import { useSetShowUsefCompId } from '@/modules/shows/hooks/use-select-events-mutations';

const MAX_LENGTH = 20;

export function UsefCompIdCard({ showId, usefCompId }: { showId: string; usefCompId: string }) {
  const [value, setValue] = useState(usefCompId);
  const { mutate } = useSetShowUsefCompId();

  function save() {
    const next = value.trim();
    if (next === usefCompId) return;
    mutate(
      { showId, usefCompId: next },
      {
        onError: () => {
          setValue(usefCompId);
        },
      },
    );
  }

  return (
    <FaCard>
      <Label htmlFor="usef-comp-id" className="mb-2 block text-[13px] font-bold text-[#0D2C23]">
        USEF competition ID
      </Label>
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
        <input
          id="usef-comp-id"
          type="text"
          inputMode="text"
          autoComplete="off"
          maxLength={MAX_LENGTH}
          value={value}
          onChange={(e) => {
            setValue(e.target.value.replace(/[^A-Za-z0-9]/g, ''));
          }}
          onBlur={save}
          onKeyDown={(e) => {
            if (e.key === 'Enter') e.currentTarget.blur();
          }}
          className={`${FA_INPUT} w-full sm:w-[300px]`}
        />
        <p className="text-[13px] font-semibold text-[#5A6B63]">
          Printed on every row of the results file you send to USEF. Example: 12123.
        </p>
      </div>
    </FaCard>
  );
}

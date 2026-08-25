'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Card } from '@/shared/ui/organizer/card';
import { GhostButton } from '@/shared/ui/organizer/buttons';
import {
  SM_CARD_PAD,
  SM_SECTION_HEAD,
  SM_NOTE,
  SM_INPUT,
} from '@/modules/shows/ui/show-manager/tokens';

export function ShareShowLink({ url, browseUrl }: { url: string; browseUrl: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success('Public link copied');
      window.setTimeout(() => {
        setCopied(false);
      }, 1800);
    } catch {
      toast.error('Could not copy — select the link and copy it manually.');
    }
  }

  return (
    <Card className={SM_CARD_PAD}>
      <h2 className={SM_SECTION_HEAD}>Public show page</h2>
      <p className={SM_NOTE}>
        A page anyone can open — riders view the show and enter right here on Field &amp; Arena.
        Share this link once the show is published.
      </p>
      <div className="flex flex-wrap items-center gap-2.5">
        <input
          readOnly
          value={url}
          onFocus={(e) => {
            e.currentTarget.select();
          }}
          className={`h-auto min-w-0 flex-1 ${SM_INPUT}`}
          aria-label="Public show link"
        />
        <GhostButton
          onClick={() => {
            void copy();
          }}
        >
          {copied ? 'Copied' : 'Copy link'}
        </GhostButton>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-forest text-[13px] font-semibold hover:underline"
        >
          Open
        </a>
      </div>
      <p className="mt-3 text-[12.5px] text-[#98A29D]">
        Every published show also appears together at{' '}
        <a
          href={browseUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-forest font-semibold hover:underline"
        >
          {browseUrl}
        </a>
        .
      </p>
    </Card>
  );
}

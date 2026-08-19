import { Card } from '@/shared/ui/organizer/card';
import { cn } from '@/shared/lib/utils';
import { SM_CARD_PAD } from '@/modules/shows/ui/show-manager/tokens';

export function ScheduleKeyCard() {
  return (
    <Card className={cn(SM_CARD_PAD, 'mb-4')}>
      <div className="text-forest mb-2 text-[13px] font-bold">Key</div>
      <div className="flex flex-wrap gap-5 text-[13px]">
        <span>
          <span className="font-bold text-[#8A6D14]">Rider name</span> — riding multiple events
          today
        </span>
        <span>
          <span className="font-bold text-[#2F6FB0] underline decoration-dotted">Rider name</span> —
          riding two or more different horses today
        </span>
        <span>
          <span className="font-bold text-[#8A6D14] underline decoration-dotted">Rider name</span> —
          both
        </span>
      </div>
    </Card>
  );
}

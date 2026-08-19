import { classSubtitle } from '@/modules/riders/utils/class-subtitle';
import { getTicketWindowStatus } from '@/modules/riders/utils/get-ticket-window-status';
import { parseTicketWindow } from '@/modules/riders/utils/parse-ticket-window';
import type { PublicShowDetail } from '@/modules/riders/types';
import { Badge } from '@/shared/ui/shadcn/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/shadcn/card';

const TICKET_WINDOW_MESSAGE: Record<ReturnType<typeof getTicketWindowStatus>, string | null> = {
  not_open_yet: 'Ticket sales for this show have not opened yet.',
  closed: 'Ticket sales for this show have closed.',
  open: null,
};

export function ShowTicketDetail({ detail }: { detail: PublicShowDetail }) {
  const { show, classes, addOns, qualTypes } = detail;
  const windowStatus = getTicketWindowStatus(parseTicketWindow(show));
  const windowMessage = TICKET_WINDOW_MESSAGE[windowStatus];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-forest text-2xl font-semibold">{show.name}</h1>
        <p className="text-fa-muted text-sm">
          {[show.date_label, show.venue_name].filter(Boolean).join(' · ')}
        </p>
      </div>

      {windowMessage && (
        <Card className="border-amber-300 bg-amber-50">
          <CardContent className="pt-4 text-sm text-amber-900">{windowMessage}</CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Classes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {classes.length === 0 && (
            <p className="text-fa-muted text-sm">No classes published yet.</p>
          )}
          {classes.map((cls) => {
            const isFull = cls.cap != null && cls.entryCount >= cls.cap;

            const classLabel = (cls.display_name?.trim() ?? '') || cls.label;
            const subtitle = classSubtitle({
              label: cls.label,
              displayName: cls.display_name,
              testOptions: cls.test_options,
            });
            return (
              <div
                key={cls.id}
                className="border-line flex items-center justify-between rounded-lg border px-3 py-2"
              >
                <div>
                  <div className="text-forest text-sm font-medium">
                    {classLabel}
                    {cls.division ? ` (${cls.division})` : ''}
                  </div>
                  {subtitle && <div className="text-fa-muted text-xs italic">{subtitle}</div>}
                  <div className="text-fa-muted text-xs">
                    {[cls.date, cls.time, cls.arena].filter(Boolean).join(' · ')}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {isFull && <Badge variant="destructive">Full</Badge>}
                  <span className="text-forest text-sm font-semibold">
                    {cls.fee != null ? `$${cls.fee.toFixed(2)}` : '—'}
                  </span>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {addOns.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Stabling &amp; add-ons</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {addOns.map((addOn) => (
              <div
                key={addOn.id}
                className="border-line flex items-center justify-between rounded-lg border px-3 py-2"
              >
                <div className="text-forest text-sm font-medium">{addOn.name}</div>
                <div className="text-fa-muted flex items-center gap-2 text-sm">
                  {addOn.remaining != null && (
                    <span>
                      {addOn.remaining > 0 ? `${addOn.remaining.toString()} left` : 'Sold out'}
                    </span>
                  )}
                  <span className="text-forest font-semibold">
                    {addOn.price != null ? `$${addOn.price.toFixed(2)}` : '—'}
                  </span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {qualTypes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Qualification types</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {qualTypes.map((qual) => (
              <div key={qual.id} className="flex items-center justify-between text-sm">
                <span className="text-forest">{qual.name}</span>
                <span className="text-forest font-semibold">
                  {qual.price != null ? `$${qual.price.toFixed(2)}` : '—'}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

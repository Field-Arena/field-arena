import 'server-only';
import { createServerClient } from '@/shared/lib/supabase/server';

export interface ArrivalDepartureRow {
  riderId: string;
  riderName: string;
  trainerName: string;
  horseStalls: number;
  tackStalls: number;
  arrivalDate: string | null;
  departureDate: string | null;
}

/* Rider-reported stabling logistics (src/modules/riders/ui/stabling-details-form.tsx)
 * were only ever readable back on the rider's own Purchases page -- an
 * organizer had no place to see arrivals/departures across all riders
 * together. This pulls one row per paid stabling request for the show. */
export async function listArrivalsDepartures(showId: string): Promise<ArrivalDepartureRow[]> {
  const supabase = await createServerClient();

  const { data, error } = await supabase
    .from('stabling_requests')
    .select(
      'rider_id, trainer_name, horse_stalls, tack_stalls, orders(arrival_date, departure_date), riders(first_name, last_name, email)',
    )
    .eq('show_id', showId);
  if (error) throw error;

  return data.map((row) => {
    // orders and riders each carry their own RLS policies, stricter in
    // orders' case (canViewMoney) than the can_view_show gate on
    // stabling_requests -- a viewer who can see this row at all can still
    // get a null embed on either side despite the not-null FKs, so both are
    // treated as genuinely nullable regardless of what the generated type
    // (based on schema constraints, not RLS) claims.
    const rider = row.riders as { first_name: string | null; last_name: string | null; email: string } | null;
    const order = row.orders as { arrival_date: string | null; departure_date: string | null } | null;
    const name = rider ? [rider.first_name, rider.last_name].filter(Boolean).join(' ').trim() : '';
    const riderName = name !== '' ? name : (rider?.email ?? '—');
    return {
      riderId: row.rider_id,
      riderName,
      trainerName: row.trainer_name,
      horseStalls: row.horse_stalls,
      tackStalls: row.tack_stalls,
      arrivalDate: order?.arrival_date ?? null,
      departureDate: order?.departure_date ?? null,
    };
  });
}

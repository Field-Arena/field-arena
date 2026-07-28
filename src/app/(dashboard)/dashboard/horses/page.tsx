import type { Metadata } from 'next';
import { getOrganizerContext } from '@/modules/staff/data/context';
import { getDocumentRequirements } from '@/modules/shows/data/setup-queries';
import { createServerClient } from '@/shared/lib/supabase/server';
import { WorkspacePage, EmptyPanel } from '@/modules/staff/ui/workspace-page';
import { StatusBadge } from '@/shared/ui/status-badge';

export const metadata: Metadata = { title: 'Horses — Field & Arena' };

interface HorseRow {
  name: string;
  rider: string | null;
  classes: number;
  /** Null when the entry has no linked horse record, so no documents can exist. */
  horseId: string | null;
  uploads: { requirementId?: string; label?: string; verified?: boolean; expirationDate?: string }[];
}

/**
 * Every horse entered in the show, and what paperwork is still outstanding —
 * ported from the legacy sidebar's "Horses" section, whose own tooltip described
 * it as "Every horse entered, and what documents are still missing".
 *
 * Horses are listed from the entry roster rather than from the horses table.
 * That is deliberate: an organizer-imported roster carries horse *names* with no
 * horses row behind them, and listing only real records would show an empty page
 * for a show with a full start list. Where a real record does exist, its uploads
 * are checked against the show's requirements.
 */
export default async function HorsesPage({
  searchParams,
}: {
  searchParams: Promise<{ show?: string }>;
}) {
  const { show: requestedShowId } = await searchParams;
  const context = await getOrganizerContext(requestedShowId);

  if (!context.currentShow) {
    return (
      <WorkspacePage
        title="Horses"
        description="Every horse entered, and what documents are still missing."
        orgName={context.orgName}
        showPicker={false}
      >
        <EmptyPanel title="No shows yet" note="Horses are listed per show." />
      </WorkspacePage>
    );
  }

  const supabase = await createServerClient();
  const showId = context.currentShow.id;

  const [{ data: classes, error: classError }, requirements] = await Promise.all([
    supabase.from('classes').select('id').eq('show_id', showId),
    getDocumentRequirements(showId),
  ]);
  if (classError) throw classError;

  let horses: HorseRow[] = [];

  if (classes.length > 0) {
    const { data: entries, error } = await supabase
      .from('class_entries')
      .select('horse, rider, horse_id')
      .in(
        'class_id',
        classes.map((c) => c.id)
      );
    if (error) throw error;

    // One row per horse, with its class count — a horse entered in three classes
    // is one horse on this screen.
    const byHorse = new Map<string, HorseRow>();
    for (const entry of entries) {
      if (!entry.horse) continue;
      const existing = byHorse.get(entry.horse);
      if (existing) {
        existing.classes += 1;
        existing.horseId ??= entry.horse_id;
      } else {
        byHorse.set(entry.horse, {
          name: entry.horse,
          rider: entry.rider,
          classes: 1,
          horseId: entry.horse_id,
          uploads: [],
        });
      }
    }

    const horseIds = [...byHorse.values()]
      .map((h) => h.horseId)
      .filter((id): id is string => id !== null);

    if (horseIds.length > 0) {
      const { data: records, error: horseError } = await supabase
        .from('horses')
        .select('id, document_uploads')
        .in('id', horseIds);
      if (horseError) throw horseError;

      const uploadsById = new Map(
        records.map((r) => [
          r.id,
          (r.document_uploads ?? []) as HorseRow['uploads'],
        ])
      );
      for (const horse of byHorse.values()) {
        if (horse.horseId) horse.uploads = uploadsById.get(horse.horseId) ?? [];
      }
    }

    horses = [...byHorse.values()].sort((a, b) => a.name.localeCompare(b.name));
  }

  const missing = horses.filter(
    (h) => requirements.length > 0 && h.uploads.length < requirements.length
  ).length;

  return (
    <WorkspacePage
      title="Horses"
      description="Every horse entered, and what documents are still missing."
      orgName={context.orgName}
      shows={context.shows}
      currentShow={context.currentShow}
    >
      <div className="stat-grid" style={{ gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' }}>
        <Stat label="Horses entered" value={horses.length} />
        <Stat label="Documents required" value={requirements.length} sub="per horse" />
        <Stat
          label="Paperwork outstanding"
          value={requirements.length === 0 ? 0 : missing}
          sub={requirements.length === 0 ? 'nothing required' : 'horses missing a document'}
        />
      </div>

      {horses.length === 0 ? (
        <EmptyPanel
          title="No horses entered"
          note="Horses appear here as riders enter, or when a roster is imported."
        />
      ) : (
        <div style={{ overflowX: 'auto', marginTop: 14 }}>
          <table>
            <caption className="sr-only">Horses entered in this show</caption>
            <thead>
              <tr>
                <th scope="col">Horse</th>
                <th scope="col">Rider</th>
                <th scope="col" className="r">
                  Classes
                </th>
                <th scope="col">Paperwork</th>
              </tr>
            </thead>
            <tbody>
              {horses.map((horse) => (
                <tr key={horse.name}>
                  <td>
                    <strong>{horse.name}</strong>
                  </td>
                  <td>{horse.rider ?? '—'}</td>
                  <td className="r">{horse.classes}</td>
                  <td>
                    {requirements.length === 0 ? (
                      <span style={{ color: 'var(--fa-muted)', fontSize: 12.5 }}>
                        None required
                      </span>
                    ) : !horse.horseId ? (
                      // A roster-imported horse has no record to attach files to.
                      <span style={{ color: 'var(--fa-muted)', fontSize: 12.5 }}>
                        Roster entry — no rider account
                      </span>
                    ) : horse.uploads.length >= requirements.length ? (
                      <StatusBadge tone="success">Complete</StatusBadge>
                    ) : (
                      <StatusBadge tone="warn">
                        {horse.uploads.length} of {requirements.length} on file
                      </StatusBadge>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </WorkspacePage>
  );
}

function Stat({ label, value, sub }: { label: string; value: number; sub?: string }) {
  return (
    <div className="stat">
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
      {sub && <div className="stat-sub">{sub}</div>}
    </div>
  );
}

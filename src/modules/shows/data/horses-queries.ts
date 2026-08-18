import 'server-only';
import { createServerClient } from '@/shared/lib/supabase/server';
import { getDocumentRequirements, type DocumentRequirement } from '@/modules/shows/data/setup-queries';
import { COGGINS_LABEL } from '@/modules/shows/constants';

/**
 * The Horses screen's reads: one row per horse entered in the show, built
 * from the entry roster rather than the horses table directly — an
 * organizer-imported roster carries horse *names* with no horses row behind
 * them (`horseId: null`), and listing only real records would show an empty
 * page for a show with a full start list. Where a real horses row does
 * exist, its document_uploads are cross-referenced against the show's own
 * document_requirements. Manually-added horses (shows.manual_horses) are
 * appended the same way legacy does — no real record, no documents.
 *
 * Ported from showstaff.html's showHorsesList() (~13638-13802) and its
 * helpers horseDocCellHtml/horseIsComplete/horseBigCheckHtml (~13505-13546).
 */

export interface ManualHorseEntry {
  id: string;
  riderName: string;
  horseName: string;
  isStallion: boolean;
  addedAt: string;
}

interface RawUpload {
  requirementId?: string;
  path?: string;
  expirationDate?: string;
  verified?: boolean;
}

export interface HorseDocumentStatus {
  requirementId: string;
  label: string;
  uploaded: boolean;
  /** Signed (horse-documents is a private bucket) — null when not uploaded. */
  url: string | null;
  expirationDate: string | null;
  requiresExpiration: boolean;
  requiresApproval: boolean;
  verified: boolean;
  /** Uploaded, but past its expiration date. */
  expired: boolean;
  /** Uploaded and current, but still awaiting a staff verification. */
  needsApproval: boolean;
}

export interface HorseRow {
  key: string;
  /** Null for a roster entry with no real horses row, or a manually-added horse — see the module doc comment. Required to verify a document or send a reminder. */
  horseId: string | null;
  horseName: string;
  riderLabel: string;
  /** Null when there is no real rider account to email — hides/disables the Remind action. */
  riderEmail: string | null;
  classesCount: number;
  isStallion: boolean;
  documents: HorseDocumentStatus[];
  /** Every requirement satisfied: uploaded, not expired, and verified wherever approval is required. */
  complete: boolean;
  missingLabels: string[];
  needsVerification: boolean;
  cogginsExpired: boolean;
}

export interface HorsesPageData {
  showId: string;
  showName: string;
  requirements: DocumentRequirement[];
  rows: HorseRow[];
}

export async function getHorsesPageData(showId: string): Promise<HorsesPageData | null> {
  const supabase = await createServerClient();

  const [showResult, requirements] = await Promise.all([
    supabase.from('shows').select('id, name, manual_horses').eq('id', showId).maybeSingle(),
    getDocumentRequirements(showId),
  ]);
  if (showResult.error) throw showResult.error;
  if (!showResult.data) return null;
  const show = showResult.data;

  // Blank-label rows (still being typed in Setup) aren't a real document requirement yet.
  const docReqs = requirements.filter((r) => r.label.trim());
  const todayStr = new Date().toISOString().slice(0, 10);

  const { data: classes, error: classError } = await supabase
    .from('classes')
    .select('id')
    .eq('show_id', showId);
  if (classError) throw classError;

  interface Group {
    name: string;
    rider: string | null;
    riderId: string | null;
    classes: number;
    horseId: string | null;
  }
  const byHorse = new Map<string, Group>();

  if (classes.length > 0) {
    const { data: entries, error } = await supabase
      .from('class_entries')
      .select('horse, rider, horse_id, rider_id')
      .in(
        'class_id',
        classes.map((c) => c.id)
      );
    if (error) throw error;

    for (const entry of entries) {
      if (!entry.horse) continue;
      const existing = byHorse.get(entry.horse);
      if (existing) {
        existing.classes += 1;
        existing.horseId ??= entry.horse_id;
        existing.riderId ??= entry.rider_id;
      } else {
        byHorse.set(entry.horse, {
          name: entry.horse,
          rider: entry.rider,
          riderId: entry.rider_id,
          classes: 1,
          horseId: entry.horse_id,
        });
      }
    }
  }

  const horseIds = [...byHorse.values()]
    .map((g) => g.horseId)
    .filter((id): id is string => id !== null);

  const uploadsByHorseId = new Map<string, RawUpload[]>();
  const stallionByHorseId = new Map<string, boolean>();
  const riderIdByHorseId = new Map<string, string | null>();

  if (horseIds.length > 0) {
    const { data: records, error } = await supabase
      .from('horses')
      .select('id, document_uploads, is_stallion, rider_id')
      .in('id', horseIds);
    if (error) throw error;
    for (const r of records) {
      uploadsByHorseId.set(r.id, (r.document_uploads ?? []) as unknown as RawUpload[]);
      stallionByHorseId.set(r.id, r.is_stallion ?? false);
      riderIdByHorseId.set(r.id, r.rider_id);
    }
  }

  // Real per-rider email for the "Remind" action: from the entry's own
  // rider_id where present, falling back to the horse record's rider_id.
  const riderIds = new Set<string>();
  for (const g of byHorse.values()) {
    if (g.riderId) riderIds.add(g.riderId);
    if (g.horseId) {
      const rid = riderIdByHorseId.get(g.horseId);
      if (rid) riderIds.add(rid);
    }
  }

  const emailByRiderId = new Map<string, string>();
  if (riderIds.size > 0) {
    const { data: riders, error } = await supabase
      .from('riders')
      .select('id, email')
      .in('id', [...riderIds]);
    if (error) throw error;
    for (const r of riders) emailByRiderId.set(r.id, r.email);
  }

  // Signed URLs for every uploaded document, batched across every row so a
  // large roster resolves in parallel rather than one row at a time.
  async function resolveDocuments(uploads: RawUpload[]): Promise<HorseDocumentStatus[]> {
    return Promise.all(
      docReqs.map(async (req): Promise<HorseDocumentStatus> => {
        const up = uploads.find((u) => u.requirementId === req.id);
        const uploaded = !!up;
        const expired =
          uploaded && !!req.requiresExpiration && !!up.expirationDate && up.expirationDate < todayStr;
        const needsApproval = uploaded && !!req.requiresApproval && !up.verified;

        let url: string | null = null;
        if (uploaded && up.path) {
          const { data: signed } = await supabase.storage
            .from('horse-documents')
            .createSignedUrl(up.path, 3600);
          url = signed?.signedUrl ?? null;
        }

        return {
          requirementId: req.id,
          label: req.label,
          uploaded,
          url,
          expirationDate: up?.expirationDate ?? null,
          requiresExpiration: !!req.requiresExpiration,
          requiresApproval: !!req.requiresApproval,
          verified: !!up?.verified,
          expired,
          needsApproval,
        };
      })
    );
  }

  function summarize(documents: HorseDocumentStatus[]) {
    return {
      complete: documents.every((d) => d.uploaded && !d.expired && !d.needsApproval),
      missingLabels: documents.filter((d) => !d.uploaded).map((d) => d.label),
      needsVerification: documents.some((d) => d.needsApproval),
      cogginsExpired: documents.some((d) => d.label === COGGINS_LABEL && d.expired),
    };
  }

  const manualHorses = (show.manual_horses ?? []) as unknown as ManualHorseEntry[];

  const rows: HorseRow[] = await Promise.all([
    ...[...byHorse.values()].map(async (group): Promise<HorseRow> => {
      const uploads = group.horseId ? (uploadsByHorseId.get(group.horseId) ?? []) : [];
      const documents = await resolveDocuments(uploads);
      const { complete, missingLabels, needsVerification, cogginsExpired } = summarize(documents);
      const riderId = group.horseId
        ? (riderIdByHorseId.get(group.horseId) ?? group.riderId)
        : group.riderId;

      return {
        key: group.horseId ?? `name:${group.name}`,
        horseId: group.horseId,
        horseName: group.name,
        riderLabel: group.rider ?? '—',
        riderEmail: riderId ? (emailByRiderId.get(riderId) ?? null) : null,
        classesCount: group.classes,
        isStallion: group.horseId ? (stallionByHorseId.get(group.horseId) ?? false) : false,
        documents,
        complete,
        missingLabels,
        needsVerification,
        cogginsExpired,
      };
    }),
    ...manualHorses.map(async (mh): Promise<HorseRow> => {
      const documents = await resolveDocuments([]);
      const { complete, missingLabels, needsVerification, cogginsExpired } = summarize(documents);

      return {
        key: `manual:${mh.id}`,
        horseId: null,
        horseName: mh.horseName,
        riderLabel: mh.riderName,
        riderEmail: null,
        classesCount: 0,
        isStallion: mh.isStallion,
        documents,
        complete,
        missingLabels,
        needsVerification,
        cogginsExpired,
      };
    }),
  ]);

  rows.sort((a, b) => a.horseName.localeCompare(b.horseName));

  return { showId: show.id, showName: show.name, requirements: docReqs, rows };
}

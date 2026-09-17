import 'server-only';
import { createServerClient } from '@/shared/lib/supabase/server';
import {
  getDocumentRequirements,
  type DocumentRequirement,
} from '@/modules/shows/data/setup-queries';
import { COGGINS_LABEL } from '@/modules/shows/constants';

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
  status?: string;
  rejectionReason?: string;
  rejectionNote?: string;
  reviewedAt?: string;
}

export type DocumentReviewStatus = 'pending' | 'approved' | 'rejected' | 'replacement_requested';

/* Rows written before the review workflow existed only ever set `verified`.
 * Every read resolves `status` from the newer field first, falling back to
 * the boolean so old rows still render correctly without a backfill. */
function resolveReviewStatus(up: RawUpload): DocumentReviewStatus {
  if (up.status === 'approved' || up.status === 'rejected' || up.status === 'replacement_requested')
    return up.status;
  return up.verified ? 'approved' : 'pending';
}

export interface HorseDocumentStatus {
  requirementId: string;
  label: string;
  uploaded: boolean;

  url: string | null;
  expirationDate: string | null;
  requiresExpiration: boolean;
  requiresApproval: boolean;
  verified: boolean;

  expired: boolean;

  needsApproval: boolean;

  status: DocumentReviewStatus;
  rejectionReason: string | null;
  rejectionNote: string | null;
}

export interface HorseRow {
  key: string;

  horseId: string | null;
  horseName: string;
  riderLabel: string;

  riderEmail: string | null;
  classesCount: number;
  isStallion: boolean;
  height: string | null;
  farrier: string | null;
  documents: HorseDocumentStatus[];

  complete: boolean;
  missingLabels: string[];
  needsVerification: boolean;
  cogginsExpired: boolean;

  /* This same horse appears on class_entries under more than one rider name
   * — a lease or catch-ride horse, not a data error. riders lists every
   * distinct name seen so the organizer can see who, not just how many. */
  isMultiEntry: boolean;
  riders: string[];
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
    riderNames: Set<string>;
  }
  const byHorse = new Map<string, Group>();

  if (classes.length > 0) {
    const { data: entries, error } = await supabase
      .from('class_entries')
      .select('horse, rider, horse_id, rider_id')
      .in(
        'class_id',
        classes.map((c) => c.id),
      );
    if (error) throw error;

    for (const entry of entries) {
      if (!entry.horse) continue;
      const existing = byHorse.get(entry.horse);
      if (existing) {
        existing.classes += 1;
        existing.horseId ??= entry.horse_id;
        existing.riderId ??= entry.rider_id;
        if (entry.rider) existing.riderNames.add(entry.rider);
      } else {
        byHorse.set(entry.horse, {
          name: entry.horse,
          rider: entry.rider,
          riderId: entry.rider_id,
          classes: 1,
          horseId: entry.horse_id,
          riderNames: new Set(entry.rider ? [entry.rider] : []),
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
  const heightByHorseId = new Map<string, string | null>();
  const farrierByHorseId = new Map<string, string | null>();

  if (horseIds.length > 0) {
    const { data: records, error } = await supabase
      .from('horses')
      .select('id, document_uploads, is_stallion, rider_id, height, farrier')
      .in('id', horseIds);
    if (error) throw error;
    for (const r of records) {
      uploadsByHorseId.set(r.id, (r.document_uploads ?? []) as unknown as RawUpload[]);
      stallionByHorseId.set(r.id, r.is_stallion ?? false);
      riderIdByHorseId.set(r.id, r.rider_id);
      heightByHorseId.set(r.id, r.height);
      farrierByHorseId.set(r.id, r.farrier);
    }
  }

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

  async function resolveDocuments(uploads: RawUpload[]): Promise<HorseDocumentStatus[]> {
    return Promise.all(
      docReqs.map(async (req): Promise<HorseDocumentStatus> => {
        const up = uploads.find((u) => u.requirementId === req.id);
        const uploaded = !!up;
        const expired =
          uploaded &&
          !!req.requiresExpiration &&
          !!up.expirationDate &&
          up.expirationDate < todayStr;
        const status = uploaded ? resolveReviewStatus(up) : 'pending';
        const needsApproval = uploaded && !!req.requiresApproval && status === 'pending';

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
          verified: status === 'approved',
          expired,
          needsApproval,
          status,
          rejectionReason: up?.rejectionReason ?? null,
          rejectionNote: up?.rejectionNote ?? null,
        };
      }),
    );
  }

  function summarize(documents: HorseDocumentStatus[]) {
    const blocked = (d: HorseDocumentStatus) =>
      !d.uploaded ||
      d.expired ||
      d.needsApproval ||
      d.status === 'rejected' ||
      d.status === 'replacement_requested';
    return {
      complete: documents.every((d) => !blocked(d)),
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

      const riders = [...group.riderNames].sort((a, b) => a.localeCompare(b));
      const isMultiEntry = riders.length > 1;

      return {
        key: group.horseId ?? `name:${group.name}`,
        horseId: group.horseId,
        horseName: group.name,
        riderLabel: isMultiEntry ? `${String(riders.length)} riders` : (group.rider ?? '—'),
        riderEmail: riderId ? (emailByRiderId.get(riderId) ?? null) : null,
        classesCount: group.classes,
        isStallion: group.horseId ? (stallionByHorseId.get(group.horseId) ?? false) : false,
        height: group.horseId ? (heightByHorseId.get(group.horseId) ?? null) : null,
        farrier: group.horseId ? (farrierByHorseId.get(group.horseId) ?? null) : null,
        documents,
        complete,
        missingLabels,
        needsVerification,
        cogginsExpired,
        isMultiEntry,
        riders,
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
        height: null,
        farrier: null,
        documents,
        complete,
        missingLabels,
        needsVerification,
        cogginsExpired,
        isMultiEntry: false,
        riders: mh.riderName ? [mh.riderName] : [],
      };
    }),
  ]);

  rows.sort((a, b) => a.horseName.localeCompare(b.horseName));

  return { showId: show.id, showName: show.name, requirements: docReqs, rows };
}

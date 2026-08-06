import {
  PERMISSION_KEYS,
  ROLE_PERMISSION_DEFAULTS,
  type PermissionKey,
} from '@/shared/constants/permissions';
import type { Score, Sheet } from './scoring-engine';
import type { MarkEntry, ScoreRow, TestDefinition } from './types';

/**
 * Resolves a staff_assignments row's effective permissions. Mirrors
 * `has_show_permission()` in the RLS migration; reimplemented locally rather
 * than imported from `modules/staff/utils.ts` because a module may not reach
 * into another module's internals — this is a third copy of the same merge
 * logic, following the precedent that file's own doc comment already
 * establishes (a second copy already exists in `modules/superadmin/utils.ts`
 * for the same reason). Postgres remains the real security boundary; this
 * only decides which buttons render.
 */
export function resolveScoringPermissions(input: {
  role: string;
  permissions: unknown;
  canScratchSkipDq?: boolean | null;
  canViewMoney?: boolean | null;
}): Record<PermissionKey, boolean> {
  const resolved = {} as Record<PermissionKey, boolean>;
  for (const key of PERMISSION_KEYS) resolved[key] = false;

  const defaults = ROLE_PERMISSION_DEFAULTS[input.role] ?? {};
  for (const key of PERMISSION_KEYS) {
    if (defaults[key]) resolved[key] = true;
  }

  if (input.canScratchSkipDq) {
    resolved.canScratch = true;
    resolved.canSkip = true;
    resolved.canEliminate = true;
  }
  if (input.canViewMoney) {
    resolved.canViewMoney = true;
  }

  if (input.permissions && typeof input.permissions === 'object') {
    const explicit = input.permissions as Record<string, unknown>;
    for (const key of PERMISSION_KEYS) {
      if (typeof explicit[key] === 'boolean') resolved[key] = explicit[key];
    }
  }

  return resolved;
}

/** Strips per-mark authorship down to the plain values scoring-engine.ts's pure functions need. */
export function toSheet(row: Pick<ScoreRow, 'movements' | 'collectives' | 'errors' | 'finalRemarks' | 'remarks' | 'submitted'>): Sheet {
  const movements: Record<string, number | null> = {};
  for (const [num, mark] of Object.entries(row.movements)) movements[num] = mark.value;

  const collectives: Record<string, number | null> = {};
  for (const [key, mark] of Object.entries(row.collectives)) collectives[key] = mark.value;

  return {
    movements,
    collectives,
    errors: row.errors,
    remarks: row.remarks,
    finalRemarks: row.finalRemarks,
    submitted: row.submitted,
  };
}

// ---------------------------------------------------------------------------
// JSON parsing — shared by data/queries.ts (reads) and data/mutations.ts
// (which needs the same test definition to compute a submitted sheet's
// percentage). One parser, not two, so the two layers can't drift apart.
// ---------------------------------------------------------------------------

export function isJsonRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function parseTestMovements(json: unknown): TestDefinition['movements'] {
  if (!Array.isArray(json)) return [];
  return json
    .filter(isJsonRecord)
    .map((m) => ({
      num: Number(m.n ?? m.num ?? 0),
      text: typeof m.text === 'string' ? m.text : '',
      coef: Number(m.coef ?? 1),
    }))
    .filter((m) => m.num > 0);
}

export function parseTestCollectives(json: unknown): TestDefinition['collectives'] {
  if (!Array.isArray(json)) return [];
  return json
    .filter(isJsonRecord)
    .map((c) => ({
      key: typeof c.key === 'string' ? c.key : '',
      label: typeof c.label === 'string' ? c.label : '',
      coef: Number(c.coef ?? 1),
    }))
    .filter((c) => c.key !== '');
}

/** A def-shaped JSON blob (class_tests row or scoring_catalog.def) to a TestDefinition. */
export function parseTestDefinition(fallbackName: string | undefined, def: unknown): TestDefinition | null {
  if (!isJsonRecord(def)) return null;
  const name = typeof def.name === 'string' ? def.name : (fallbackName ?? '');
  return { name, movements: parseTestMovements(def.movements), collectives: parseTestCollectives(def.collectives) };
}

export function parseMarkMap(json: unknown): Record<string, MarkEntry> {
  if (!isJsonRecord(json)) return {};
  const out: Record<string, MarkEntry> = {};
  for (const [key, raw] of Object.entries(json)) {
    if (isJsonRecord(raw)) {
      const value = typeof raw.value === 'number' ? raw.value : null;
      const enteredBy = raw.enteredBy === 'judge' || raw.enteredBy === 'scribe' ? raw.enteredBy : null;
      out[key] = { value, enteredBy };
    } else if (typeof raw === 'number') {
      out[key] = { value: raw, enteredBy: null };
    }
  }
  return out;
}

export function asStringMap(json: unknown): Record<string, string> {
  if (!isJsonRecord(json)) return {};
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(json)) if (typeof v === 'string') out[k] = v;
  return out;
}

export function asBooleanMap(json: unknown): Record<string, boolean> {
  if (!isJsonRecord(json)) return {};
  const out: Record<string, boolean> = {};
  for (const [k, v] of Object.entries(json)) if (typeof v === 'boolean') out[k] = v;
  return out;
}

/** `class_entries.final_pct` is a mixed-type text column by design — number-as-text, or 'SCR'/'ELIM'. */
export function parseFinalPct(raw: string | null): Score | null {
  if (raw === null) return null;
  if (raw === 'SCR' || raw === 'ELIM') return raw;
  const n = Number(raw);
  return Number.isNaN(n) ? null : n;
}

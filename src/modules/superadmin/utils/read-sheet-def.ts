import type {
  MovementItem,
  CollectiveItem,
  TechnicalItem,
  ArtisticItem,
  CategoryItem,
} from '@/modules/superadmin/schemas';

/* Editor-facing shape: every numeric the form binds to is held as a string
 * while it is being typed (an empty box is not `0`), and converted back on
 * save. Mirrors what the legacy editor did with raw input values. */
export interface SheetDefShape {
  intro: string;
  purpose: string;
  arena: string;
  rideTime: string;
  maxPoints: string;
  errorScheduleText: string;
  footNote: string;
  movements: MovementItem[];
  collectives: CollectiveItem[];
  technical: TechnicalItem[];
  artistic: ArtisticItem[];
  categories: CategoryItem[];
  method: string;
  criteria: string;
}

function str(v: unknown): string {
  if (typeof v === 'string') return v;
  if (typeof v === 'number' || typeof v === 'boolean') return String(v);
  return '';
}

function num(v: unknown, fallback: number): number {
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  if (typeof v === 'string' && v.trim() !== '') {
    const parsed = Number(v);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

function rows(v: unknown): Record<string, unknown>[] {
  if (!Array.isArray(v)) return [];
  return v.map((item) => (item && typeof item === 'object' ? item : {}) as Record<string, unknown>);
}

/* Empty def — legacy famDef(). Switching scoring family resets the criteria
 * to this, because a movement sheet's movements/collectives mean nothing to
 * the freestyle or placing renderer and would otherwise be persisted as
 * orphaned data under the new family. */
export function emptySheetDef(): SheetDefShape {
  return {
    intro: '',
    purpose: '',
    arena: '',
    rideTime: '',
    maxPoints: '',
    errorScheduleText: '',
    footNote: '',
    movements: [],
    collectives: [],
    technical: [],
    artistic: [],
    categories: [],
    method: '',
    criteria: '',
  };
}

export function readSheetDef(raw: unknown): SheetDefShape {
  const d = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;

  // `num` is the legacy key, `n` the one this app writes — accept either so a
  // sheet authored under one schema still opens under the other.
  const movements: MovementItem[] = rows(d.movements).map((mv, i) => {
    const n = num(mv.n ?? mv.num, i + 1);
    return {
      n,
      num: n,
      text: str(mv.text ?? mv.test),
      directives: str(mv.directives),
      actions: Array.isArray(mv.actions) ? mv.actions.map(str).filter(Boolean) : [],
      coef: num(mv.coef, 1),
    };
  });

  const collectives: CollectiveItem[] = rows(d.collectives).map((cm, i) => {
    const name = str(cm.name ?? cm.label);
    return {
      key: str(cm.key) || `c${String(i + 1)}`,
      name,
      label: name,
      note: str(cm.note),
      coef: num(cm.coef, 1),
    };
  });

  return {
    intro: str(d.intro),
    purpose: str(d.purpose),
    arena: str(d.arena),
    rideTime: str(d.rideTime),
    maxPoints: d.maxPoints == null ? '' : str(d.maxPoints),
    errorScheduleText: str(d.errorScheduleText),
    footNote: str(d.footNote),
    movements,
    collectives,
    technical: rows(d.technical).map((t) => ({ name: str(t.name), criteria: str(t.criteria) })),
    artistic: rows(d.artistic).map((a) => ({
      name: str(a.name),
      coef: num(a.coef, 1),
      criteria: str(a.criteria),
    })),
    categories: rows(d.categories).map((c) => ({
      name: str(c.name),
      weight: num(c.weight, 0),
      criteria: str(c.criteria),
    })),
    method: str(d.method),
    criteria: str(d.criteria),
  };
}

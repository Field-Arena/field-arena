import type { MovementItem, CollectiveItem } from '@/modules/superadmin/schemas';

export interface SheetDefShape {
  arena: string;
  rideTime: string;
  maxPoints: string;
  intro: string;
  errorScheduleText: string;
  movements: MovementItem[];
  collectives: CollectiveItem[];
}

export function readSheetDef(raw: unknown): SheetDefShape {
  const d = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const str = (v: unknown) => {
    if (typeof v === 'string') return v;
    if (typeof v === 'number' || typeof v === 'boolean') return String(v);
    return '';
  };
  const movements: MovementItem[] = Array.isArray(d.movements)
    ? d.movements.map((m, i) => {
        const mv = (m ?? {}) as Record<string, unknown>;
        return {
          n: typeof mv.n === 'number' ? mv.n : i + 1,
          text: str(mv.text),
          coef: typeof mv.coef === 'number' ? mv.coef : 1,
        };
      })
    : [];
  const collectives: CollectiveItem[] = Array.isArray(d.collectives)
    ? d.collectives.map((c) => {
        const cm = (c ?? {}) as Record<string, unknown>;
        return {
          name: str(cm.name ?? cm.label),
          coef: typeof cm.coef === 'number' ? cm.coef : 1,
        };
      })
    : [];
  return {
    arena: str(d.arena),
    rideTime: str(d.rideTime),
    maxPoints: d.maxPoints == null ? '' : str(d.maxPoints),
    intro: str(d.intro),
    errorScheduleText: str(d.errorScheduleText),
    movements,
    collectives,
  };
}

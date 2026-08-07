import { create } from 'zustand';

/**
 * In-progress entry cart: which classes are selected, which qualification
 * types apply to each, and which horse(s) are assigned to each — all purely
 * client-side, in-memory state. Mirrors legacy's realSelectedClasses /
 * realQualSelections / realClassHorse (rider.html) as one Zustand store
 * instead of three module-level mutable variables.
 *
 * No persistence layer (unlike legacy's sessionStorage cart-resume, which
 * existed specifically to survive a redirect out to Stripe's hosted checkout
 * and back). Checkout is a later phase; there is nothing yet that navigates a
 * rider away from this page and back, so nothing to resume.
 *
 * Scoped to one show at a time — `reset()` is called when a rider lands on a
 * different show's ticket page, and the store is never keyed by showId, so a
 * stale cart from a previous show should never carry forward silently.
 */
interface EntryCartState {
  /** classId -> selected */
  selectedClassIds: Set<string>;
  /** classId -> selected qualTypeIds */
  qualSelections: Record<string, Set<string>>;
  /** classId -> ordered horseId slots (null = unassigned; more than one slot = same class, multiple horses) */
  classHorseAssignments: Record<string, (string | null)[]>;
  /** addOnId -> quantity */
  addOnQuantities: Record<string, number>;

  toggleClass: (classId: string) => void;
  toggleQualification: (classId: string, qualTypeId: string) => void;
  setAddOnQuantity: (addOnId: string, qty: number) => void;
  setClassHorse: (classId: string, slotIndex: number, horseId: string | null) => void;
  addClassHorseSlot: (classId: string) => void;
  removeClassHorseSlot: (classId: string, slotIndex: number) => void;
  reset: () => void;
}

const INITIAL_STATE = {
  selectedClassIds: new Set<string>(),
  qualSelections: {} as Record<string, Set<string>>,
  classHorseAssignments: {} as Record<string, (string | null)[]>,
  addOnQuantities: {} as Record<string, number>,
};

export const useEntryCartStore = create<EntryCartState>((set) => ({
  ...INITIAL_STATE,

  toggleClass: (classId) => {
    set((state) => {
      const selectedClassIds = new Set(state.selectedClassIds);
      const classHorseAssignments = { ...state.classHorseAssignments };
      const qualSelections = { ...state.qualSelections };
      if (selectedClassIds.has(classId)) {
        selectedClassIds.delete(classId);
        Reflect.deleteProperty(classHorseAssignments, classId);
        Reflect.deleteProperty(qualSelections, classId);
      } else {
        selectedClassIds.add(classId);
        classHorseAssignments[classId] = [null];
      }
      return { selectedClassIds, classHorseAssignments, qualSelections };
    });
  },

  toggleQualification: (classId, qualTypeId) => {
    set((state) => {
      const current = new Set(state.qualSelections[classId] ?? []);
      if (current.has(qualTypeId)) current.delete(qualTypeId);
      else current.add(qualTypeId);
      return { qualSelections: { ...state.qualSelections, [classId]: current } };
    });
  },

  setAddOnQuantity: (addOnId, qty) => {
    set((state) => ({
      addOnQuantities: { ...state.addOnQuantities, [addOnId]: Math.max(0, qty) },
    }));
  },

  setClassHorse: (classId, slotIndex, horseId) => {
    set((state) => {
      const slots = [...(state.classHorseAssignments[classId] ?? [null])];
      slots[slotIndex] = horseId;
      return { classHorseAssignments: { ...state.classHorseAssignments, [classId]: slots } };
    });
  },

  addClassHorseSlot: (classId) => {
    set((state) => {
      const slots = [...(state.classHorseAssignments[classId] ?? [null]), null];
      return { classHorseAssignments: { ...state.classHorseAssignments, [classId]: slots } };
    });
  },

  removeClassHorseSlot: (classId, slotIndex) => {
    set((state) => {
      const slots = (state.classHorseAssignments[classId] ?? [null]).filter(
        (_, i) => i !== slotIndex
      );
      return {
        classHorseAssignments: {
          ...state.classHorseAssignments,
          [classId]: slots.length ? slots : [null],
        },
      };
    });
  },

  reset: () => {
    set({ ...INITIAL_STATE });
  },
}));

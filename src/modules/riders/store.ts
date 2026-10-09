import { create } from 'zustand';
import type { EntryDivisionCode } from '@/modules/riders/types';

interface EntryCartState {
  selectedClassIds: Set<string>;

  qualSelections: Record<string, Set<string>>;

  classHorseAssignments: Record<string, (string | null)[]>;

  addOnQuantities: Record<string, number>;

  /* Test of Choice classes list several possible tests (classes.test_options);
   * the rider must pick exactly one before checkout. Empty/absent means either
   * "not a Test of Choice class" or "not chosen yet" — the picker UI is what
   * tells those apart, since it only renders when test_options is non-empty. */
  testChoices: Record<string, string>;

  /* The rider division (J/Y/A/O) chosen for each selected class. A newly
   * selected class starts on the last division the rider picked, so a rider
   * who always rides Adult Amateur only chooses it once. */
  divisionChoices: Record<string, EntryDivisionCode>;
  lastDivision: EntryDivisionCode | null;

  /* Trainer/barn name, "stable with" request, and notes — captured once per
   * cart, not per add-on line, and only required when the cart includes a
   * stalls/tack-granting add-on (see cartNeedsStablingDetails). */
  stablingDetails: { trainerName: string; stableWith: string; notes: string };

  toggleClass: (
    classId: string,
    defaults?: { horseId?: string | null; division?: EntryDivisionCode | null },
  ) => void;
  setDivision: (classId: string, division: EntryDivisionCode) => void;
  fillEmptyHorseSlots: (horseId: string) => void;
  toggleQualification: (classId: string, qualTypeId: string) => void;
  setAddOnQuantity: (addOnId: string, qty: number) => void;
  setClassHorse: (classId: string, slotIndex: number, horseId: string | null) => void;
  addClassHorseSlot: (classId: string) => void;
  removeClassHorseSlot: (classId: string, slotIndex: number) => void;
  setTestChoice: (classId: string, testTitle: string) => void;
  setStablingDetails: (patch: Partial<EntryCartState['stablingDetails']>) => void;
  reset: () => void;
}

const INITIAL_STATE = {
  selectedClassIds: new Set<string>(),
  qualSelections: {} as Record<string, Set<string>>,
  classHorseAssignments: {} as Record<string, (string | null)[]>,
  addOnQuantities: {} as Record<string, number>,
  testChoices: {} as Record<string, string>,
  divisionChoices: {} as Record<string, EntryDivisionCode>,
  lastDivision: null as EntryDivisionCode | null,
  stablingDetails: { trainerName: '', stableWith: '', notes: '' },
};

export const useEntryCartStore = create<EntryCartState>((set) => ({
  ...INITIAL_STATE,

  toggleClass: (classId, defaults) => {
    set((state) => {
      const selectedClassIds = new Set(state.selectedClassIds);
      const classHorseAssignments = { ...state.classHorseAssignments };
      const qualSelections = { ...state.qualSelections };
      const testChoices = { ...state.testChoices };
      const divisionChoices = { ...state.divisionChoices };
      if (selectedClassIds.has(classId)) {
        selectedClassIds.delete(classId);
        Reflect.deleteProperty(classHorseAssignments, classId);
        Reflect.deleteProperty(qualSelections, classId);
        Reflect.deleteProperty(testChoices, classId);
        Reflect.deleteProperty(divisionChoices, classId);
      } else {
        selectedClassIds.add(classId);
        // A rider with exactly one horse never has to choose it per class.
        classHorseAssignments[classId] = [defaults?.horseId ?? null];
        const division = state.lastDivision ?? defaults?.division ?? null;
        if (division) divisionChoices[classId] = division;
      }
      return {
        selectedClassIds,
        classHorseAssignments,
        qualSelections,
        testChoices,
        divisionChoices,
      };
    });
  },

  setDivision: (classId, division) => {
    set((state) => ({
      divisionChoices: { ...state.divisionChoices, [classId]: division },
      lastDivision: division,
    }));
  },

  fillEmptyHorseSlots: (horseId) => {
    set((state) => {
      let changed = false;
      const classHorseAssignments = { ...state.classHorseAssignments };
      for (const classId of state.selectedClassIds) {
        const slots = classHorseAssignments[classId] ?? [null];
        if (slots.some(Boolean)) continue;
        classHorseAssignments[classId] = [horseId];
        changed = true;
      }
      return changed ? { classHorseAssignments } : {};
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
        (_, i) => i !== slotIndex,
      );
      return {
        classHorseAssignments: {
          ...state.classHorseAssignments,
          [classId]: slots.length ? slots : [null],
        },
      };
    });
  },

  setTestChoice: (classId, testTitle) => {
    set((state) => ({ testChoices: { ...state.testChoices, [classId]: testTitle } }));
  },

  setStablingDetails: (patch) => {
    set((state) => ({ stablingDetails: { ...state.stablingDetails, ...patch } }));
  },

  reset: () => {
    set({ ...INITIAL_STATE });
  },
}));

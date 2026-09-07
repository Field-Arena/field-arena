import { create } from 'zustand';

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

  toggleClass: (classId: string) => void;
  toggleQualification: (classId: string, qualTypeId: string) => void;
  setAddOnQuantity: (addOnId: string, qty: number) => void;
  setClassHorse: (classId: string, slotIndex: number, horseId: string | null) => void;
  addClassHorseSlot: (classId: string) => void;
  removeClassHorseSlot: (classId: string, slotIndex: number) => void;
  setTestChoice: (classId: string, testTitle: string) => void;
  reset: () => void;
}

const INITIAL_STATE = {
  selectedClassIds: new Set<string>(),
  qualSelections: {} as Record<string, Set<string>>,
  classHorseAssignments: {} as Record<string, (string | null)[]>,
  addOnQuantities: {} as Record<string, number>,
  testChoices: {} as Record<string, string>,
};

export const useEntryCartStore = create<EntryCartState>((set) => ({
  ...INITIAL_STATE,

  toggleClass: (classId) => {
    set((state) => {
      const selectedClassIds = new Set(state.selectedClassIds);
      const classHorseAssignments = { ...state.classHorseAssignments };
      const qualSelections = { ...state.qualSelections };
      const testChoices = { ...state.testChoices };
      if (selectedClassIds.has(classId)) {
        selectedClassIds.delete(classId);
        Reflect.deleteProperty(classHorseAssignments, classId);
        Reflect.deleteProperty(qualSelections, classId);
        Reflect.deleteProperty(testChoices, classId);
      } else {
        selectedClassIds.add(classId);
        classHorseAssignments[classId] = [null];
      }
      return { selectedClassIds, classHorseAssignments, qualSelections, testChoices };
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

  reset: () => {
    set({ ...INITIAL_STATE });
  },
}));

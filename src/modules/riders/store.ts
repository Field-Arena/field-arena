import { create } from 'zustand';

interface EntryCartState {
  selectedClassIds: Set<string>;

  qualSelections: Record<string, Set<string>>;

  classHorseAssignments: Record<string, (string | null)[]>;

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

  reset: () => {
    set({ ...INITIAL_STATE });
  },
}));

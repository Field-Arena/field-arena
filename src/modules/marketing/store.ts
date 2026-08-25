import { create } from 'zustand';

interface DemoDialogState {
  open: boolean;
  openDialog: () => void;
  setOpen: (open: boolean) => void;
}

export const useDemoDialogStore = create<DemoDialogState>((set) => ({
  open: false,
  openDialog: () => {
    set({ open: true });
  },
  setOpen: (open) => {
    set({ open });
  },
}));

import { create } from 'zustand';

interface LoginDialogState {
  open: boolean;

  notice: string | null;
  openDialog: () => void;
  openWithNotice: (notice: string) => void;
  setOpen: (open: boolean) => void;
}

export const useLoginDialogStore = create<LoginDialogState>((set) => ({
  open: false,
  notice: null,
  openDialog: () => {
    set({ open: true, notice: null });
  },
  openWithNotice: (notice) => {
    set({ open: true, notice });
  },
  setOpen: (open) => {
    set(open ? { open: true } : { open: false, notice: null });
  },
}));

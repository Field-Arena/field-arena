import { create } from 'zustand';

interface LoginDialogState {
  open: boolean;

  notice: string | null;
  /** Deep link the proxy bounced the visitor away from (`?next=`); sign-in returns there. */
  next: string | null;
  openDialog: () => void;
  openWithNotice: (notice: string) => void;
  setOpen: (open: boolean) => void;
  setNext: (next: string | null) => void;
}

export const useLoginDialogStore = create<LoginDialogState>((set) => ({
  open: false,
  notice: null,
  next: null,
  openDialog: () => {
    set({ open: true, notice: null });
  },
  openWithNotice: (notice) => {
    set({ open: true, notice });
  },
  setOpen: (open) => {
    set(open ? { open: true } : { open: false, notice: null });
  },
  setNext: (next) => {
    set({ next });
  },
}));

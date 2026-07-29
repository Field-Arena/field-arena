import { create } from 'zustand';

/**
 * Open state for the sign-in dialog.
 *
 * A store rather than a URL param, for the same reason the demo dialog uses one:
 * routing it through the URL makes every trigger a navigation, and a navigation
 * re-renders the boundary the dialog sits in — which throws away in-flight form
 * state at exactly the wrong moment.
 */
interface LoginDialogState {
  open: boolean;
  /**
   * A message shown inside the dialog above the form — e.g. why a just-verified
   * but un-provisioned account can't get in. Cleared when the dialog closes.
   */
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

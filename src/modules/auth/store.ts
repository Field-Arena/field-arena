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
  openDialog: () => void;
  setOpen: (open: boolean) => void;
}

export const useLoginDialogStore = create<LoginDialogState>((set) => ({
  open: false,
  openDialog: () => {
    set({ open: true });
  },
  setOpen: (open) => {
    set({ open });
  },
}));

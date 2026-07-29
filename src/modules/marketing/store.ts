import { create } from 'zustand';

/**
 * Open state for the "Book a demo" dialog.
 *
 * Deliberately NOT the URL. Routing it through `?demo=1` meant every trigger was
 * a client-side navigation, and the navigation re-rendered the Suspense boundary
 * the dialog sits in — so the moment the server action returned, the dialog
 * remounted and threw away the "thank you" state it had just been given. The
 * lead was written and the visitor still saw the empty form, which reads as a
 * failure and invites a second submission.
 *
 * A store keeps the dialog mounted across the whole interaction. `?demo=1` is
 * still honoured once on load (see DemoDialogMount) so the dialog stays
 * linkable.
 */
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

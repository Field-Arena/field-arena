'use client';

import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { readableError } from '@/shared/lib/error-message';
import {
  createShow,
  createDraftShow,
  createClass,
  createDivision,
  renameDivision,
  deleteDivision,
  createAddOn,
  setShowPublished,
  updateShowDetails,
  updateShowLocations,
  applySavedVenue,
  updateSchedulePrefs,
  deleteShow,
  updateContact,
  updatePrizeList,
  updateDocumentRequirements,
  updateMerchandise,
  saveWaiverText,
  approveWaiver,
} from '@/modules/shows/data/mutations';
import type {
  CreateShowInput,
  CreateClassInput,
  CreateDivisionInput,
  RenameDivisionInput,
  CreateAddOnInput,
  UpdateShowDetailsInput,
  UpdateShowLocationsInput,
  UpdateSchedulePrefsInput,
  UpdateContactInput,
  UpdatePrizeListInput,
  UpdateDocumentRequirementsInput,
  UpdateMerchandiseInput,
  SaveWaiverTextInput,
} from '@/modules/shows/schemas';

const message = readableError;

export function useCreateShow() {
  const router = useRouter();

  return useMutation({
    mutationFn: (input: CreateShowInput) => createShow(input),
    onSuccess: ({ id }) => {
      toast.success('Show created — start with Setup.');

      router.push(`/dashboard/shows/${id}`);
    },
    onError: (error) => {
      toast.error(message(error, 'Could not create the show'));
    },
  });
}

export function useCreateClass(options?: { onSuccess?: () => void }) {
  return useMutation({
    mutationFn: (input: CreateClassInput) => createClass(input),
    onSuccess: () => {
      toast.success('Class added');
      options?.onSuccess?.();
    },
    onError: (error) => {
      toast.error(message(error, 'Could not add the class'));
    },
  });
}

export function useCreateDivision(options?: { onSuccess?: (id: string, name: string) => void }) {
  return useMutation({
    mutationFn: (input: CreateDivisionInput) => createDivision(input),
    onSuccess: ({ id }, variables) => {
      toast.success('Division added');
      options?.onSuccess?.(id, variables.name);
    },
    onError: (error) => {
      toast.error(message(error, 'Could not add the division'));
    },
  });
}

export function useRenameDivision(options?: { onSuccess?: () => void }) {
  return useMutation({
    mutationFn: (input: RenameDivisionInput) => renameDivision(input),
    onSuccess: () => {
      options?.onSuccess?.();
    },
    onError: (error) => {
      toast.error(message(error, 'Could not rename the division'));
    },
  });
}

export function useDeleteDivision(options?: { onSuccess?: () => void }) {
  return useMutation({
    mutationFn: (divisionId: string) => deleteDivision(divisionId),
    onSuccess: () => {
      options?.onSuccess?.();
    },
    onError: (error) => {
      toast.error(message(error, 'Could not remove the division'));
    },
  });
}

export function useCreateAddOn(options?: { onSuccess?: () => void }) {
  return useMutation({
    mutationFn: (input: CreateAddOnInput) => createAddOn(input),
    onSuccess: () => {
      toast.success('Add-on created');
      options?.onSuccess?.();
    },
    onError: (error) => {
      toast.error(message(error, 'Could not create the add-on'));
    },
  });
}

export function useUpdateShowDetails() {
  return useMutation({
    mutationFn: (input: UpdateShowDetailsInput) => updateShowDetails(input),
    onError: (error) => {
      toast.error(
        message(error, "Couldn't save that change — check your connection and try again."),
      );
    },
  });
}

export function useUpdateShowLocations() {
  return useMutation({
    mutationFn: (input: UpdateShowLocationsInput) => updateShowLocations(input),
    onError: (error) => {
      toast.error(
        message(error, "Couldn't save that change — check your connection and try again."),
      );
    },
  });
}

export function useApplySavedVenue(options?: { onSuccess?: () => void }) {
  return useMutation({
    mutationFn: ({ showId, venueId }: { showId: string; venueId: string }) =>
      applySavedVenue(showId, venueId),
    onSuccess: () => {
      options?.onSuccess?.();
    },
    onError: (error) => {
      toast.error(
        message(error, "Couldn't apply that venue — check your connection and try again."),
      );
    },
  });
}

export function useUpdateSchedulePrefs() {
  return useMutation({
    mutationFn: (input: UpdateSchedulePrefsInput) => updateSchedulePrefs(input),
    onError: (error) => {
      toast.error(
        message(error, "Couldn't save that change — check your connection and try again."),
      );
    },
  });
}

export function useUpdateContact() {
  return useMutation({
    mutationFn: (input: UpdateContactInput) => updateContact(input),
    onError: (error) => {
      toast.error(
        message(error, "Couldn't save that change — check your connection and try again."),
      );
    },
  });
}

export function useUpdatePrizeList() {
  return useMutation({
    mutationFn: (input: UpdatePrizeListInput) => updatePrizeList(input),
    onError: (error) => {
      toast.error(
        message(error, "Couldn't save that change — check your connection and try again."),
      );
    },
  });
}

export function useUpdateDocumentRequirements() {
  return useMutation({
    mutationFn: (input: UpdateDocumentRequirementsInput) => updateDocumentRequirements(input),
    onError: (error) => {
      toast.error(
        message(error, "Couldn't save that change — check your connection and try again."),
      );
    },
  });
}

export function useUpdateMerchandise() {
  return useMutation({
    mutationFn: (input: UpdateMerchandiseInput) => updateMerchandise(input),
    onError: (error) => {
      toast.error(
        message(error, "Couldn't save that change — check your connection and try again."),
      );
    },
  });
}

export function useSaveWaiverText(options?: { onSuccess?: () => void }) {
  return useMutation({
    mutationFn: (input: SaveWaiverTextInput) => saveWaiverText(input),
    onSuccess: () => {
      toast.success('Waiver text saved.');
      options?.onSuccess?.();
    },
    onError: (error) => {
      toast.error(message(error, "Couldn't save the waiver text"));
    },
  });
}

export function useApproveWaiver(options?: { onSuccess?: () => void }) {
  return useMutation({
    mutationFn: ({ showId, waiverText }: { showId: string; waiverText: string }) =>
      approveWaiver(showId, waiverText),
    onSuccess: () => {
      toast.success('Waiver approved.');
      options?.onSuccess?.();
    },
    onError: (error) => {
      toast.error(message(error, 'Could not approve the waiver'));
    },
  });
}

export function useSetShowPublished() {
  const router = useRouter();

  return useMutation({
    mutationFn: ({ showId, published }: { showId: string; published: boolean }) =>
      setShowPublished(showId, published),
    onSuccess: (_data, { published }) => {
      toast.success(
        published
          ? 'Show published — riders can now see and enter it'
          : 'Show unpublished — it is hidden from riders again',
      );
      router.refresh();
    },
    onError: (error) => {
      toast.error(message(error, 'Could not change publish state'));
    },
  });
}

export function useDeleteShow(options?: { onSuccess?: () => void }) {
  const router = useRouter();

  return useMutation({
    mutationFn: (showId: string) => deleteShow(showId),
    onSuccess: () => {
      toast.success('Show deleted.');
      router.refresh();
      options?.onSuccess?.();
    },
    onError: (error) => {
      toast.error(message(error, 'Could not delete this show'));
    },
  });
}

export function useCreateDraftShow() {
  const router = useRouter();

  return useMutation({
    mutationFn: () => createDraftShow(),
    onSuccess: ({ id }) => {
      router.push(`/dashboard/shows/${id}`);
      router.refresh();
    },
    onError: (error) => {
      toast.error(readableError(error, 'Could not create the show'));
    },
  });
}

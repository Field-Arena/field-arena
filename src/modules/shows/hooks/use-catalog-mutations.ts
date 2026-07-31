'use client';

import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { readableError } from '@/shared/lib/error-message';
import {
  createAddOn,
  createQualType,
  createVendorItem,
  deleteAddOn,
  deleteQualType,
  deleteVendorItem,
  loadStandardVendorSpaces,
  removeVendorMap,
  updateAddOn,
  updateQualType,
  updateVendorItem,
  uploadShowBranding,
  uploadVendorMap,
} from '../data/mutations';
import type {
  CreateAddOnInput,
  CreateQualTypeInput,
  CreateVendorItemInput,
  UpdateCatalogItemInput,
  UpdateVendorItemInput,
  UploadShowBrandingInput,
  UploadVendorMapInput,
} from '../schemas';

/**
 * The Rider Entries tab's three lists, plus branding and the vendor map.
 *
 * Add-ons and qualifications share updateCatalogItemSchema — same two editable
 * fields — so their edit hooks differ only in which Server Action they call.
 */

/** Re-exported so every hook in this module reports the same way. */
const message = readableError;

interface Options {
  onSuccess?: () => void;
}

/* ── Add-ons ─────────────────────────────────────────────────────────────── */

export function useCreateAddOn(options?: Options) {
  const router = useRouter();

  return useMutation({
    mutationFn: (input: CreateAddOnInput) => createAddOn(input),
    onSuccess: () => {
      toast.success('Add-on added');
      router.refresh();
      options?.onSuccess?.();
    },
    onError: (error) => {
      toast.error(message(error, 'Could not add the add-on'));
    },
  });
}

export function useUpdateAddOn() {
  const router = useRouter();

  return useMutation({
    mutationFn: (input: UpdateCatalogItemInput) => updateAddOn(input),
    onSuccess: () => {
      router.refresh();
    },
    onError: (error) => {
      toast.error(message(error, 'Could not save the add-on'));
    },
  });
}

export function useDeleteAddOn() {
  const router = useRouter();

  return useMutation({
    mutationFn: (id: string) => deleteAddOn(id),
    onSuccess: () => {
      toast.success('Add-on removed');
      router.refresh();
    },
    onError: (error) => {
      toast.error(message(error, 'Could not remove the add-on'));
    },
  });
}

/* ── Vendor spaces ───────────────────────────────────────────────────────── */

export function useCreateVendorItem(options?: Options) {
  const router = useRouter();

  return useMutation({
    mutationFn: (input: CreateVendorItemInput) => createVendorItem(input),
    onSuccess: () => {
      toast.success('Vendor space added');
      router.refresh();
      options?.onSuccess?.();
    },
    onError: (error) => {
      toast.error(message(error, 'Could not add the vendor space'));
    },
  });
}

export function useUpdateVendorItem() {
  const router = useRouter();

  return useMutation({
    mutationFn: (input: UpdateVendorItemInput) => updateVendorItem(input),
    onSuccess: () => {
      router.refresh();
    },
    onError: (error) => {
      toast.error(message(error, 'Could not save the vendor space'));
    },
  });
}

export function useDeleteVendorItem() {
  const router = useRouter();

  return useMutation({
    mutationFn: (id: string) => deleteVendorItem(id),
    onSuccess: () => {
      toast.success('Vendor space removed');
      router.refresh();
    },
    onError: (error) => {
      toast.error(message(error, 'Could not remove the vendor space'));
    },
  });
}

export function useLoadStandardVendorSpaces() {
  const router = useRouter();

  return useMutation({
    mutationFn: (showId: string) => loadStandardVendorSpaces(showId),
    onSuccess: (rows) => {
      // The action returns only the rows it actually inserted — it skips names
      // the show already has, so a repeat click adds nothing.
      const added = rows.length;
      toast.success(
        added === 0
          ? 'Every standard space is already on this show'
          : `${String(added)} standard ${added === 1 ? 'space' : 'spaces'} added`
      );
      router.refresh();
    },
    onError: (error) => {
      toast.error(message(error, 'Could not load the standard spaces'));
    },
  });
}

/* ── Qualifications ──────────────────────────────────────────────────────── */

export function useCreateQualType(options?: Options) {
  const router = useRouter();

  return useMutation({
    mutationFn: (input: CreateQualTypeInput) => createQualType(input),
    onSuccess: () => {
      toast.success('Qualification added');
      router.refresh();
      options?.onSuccess?.();
    },
    onError: (error) => {
      toast.error(message(error, 'Could not add the qualification'));
    },
  });
}

export function useUpdateQualType() {
  const router = useRouter();

  return useMutation({
    mutationFn: (input: UpdateCatalogItemInput) => updateQualType(input),
    onSuccess: () => {
      router.refresh();
    },
    onError: (error) => {
      toast.error(message(error, 'Could not save the qualification'));
    },
  });
}

export function useDeleteQualType() {
  const router = useRouter();

  return useMutation({
    mutationFn: (id: string) => deleteQualType(id),
    onSuccess: () => {
      toast.success('Qualification removed');
      router.refresh();
    },
    onError: (error) => {
      toast.error(message(error, 'Could not remove the qualification'));
    },
  });
}

/* ── Branding and vendor map ─────────────────────────────────────────────── */

export function useUploadShowBranding() {
  const router = useRouter();

  return useMutation({
    mutationFn: (input: UploadShowBrandingInput) => uploadShowBranding(input),
    onSuccess: (_data, { kind }) => {
      toast.success(kind === 'logo' ? 'Logo uploaded' : 'Banner uploaded');
      router.refresh();
    },
    onError: (error) => {
      toast.error(message(error, 'Could not upload the image'));
    },
  });
}

export function useUploadVendorMap() {
  const router = useRouter();

  return useMutation({
    mutationFn: (input: UploadVendorMapInput) => uploadVendorMap(input),
    onSuccess: () => {
      toast.success('Vendor map uploaded');
      router.refresh();
    },
    onError: (error) => {
      toast.error(message(error, 'Could not upload the map'));
    },
  });
}

export function useRemoveVendorMap() {
  const router = useRouter();

  return useMutation({
    mutationFn: (showId: string) => removeVendorMap(showId),
    onSuccess: () => {
      toast.success('Vendor map removed');
      router.refresh();
    },
    onError: (error) => {
      toast.error(message(error, 'Could not remove the map'));
    },
  });
}

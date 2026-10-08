'use client';

import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { readableError } from '@/shared/lib/error-message';
import {
  addCatalogGroup,
  addCustomClass,
  addQualTypePreset,
  createTocClass,
  removeCatalogGroup,
  removeTestClasses,
  setTestDivision,
  setTestQualifying,
  updateTestFee,
  updateGroupLocation,
  updateGroupDivision,
  updateTicketWindow,
} from '@/modules/shows/data/mutations';
import type {
  AddCatalogGroupInput,
  AddCustomClassInput,
  AddQualTypePresetInput,
  CreateTocClassInput,
  RemoveTestClassesInput,
  SetTestDivisionInput,
  SetTestQualifyingInput,
  UpdateTestFeeInput,
  UpdateGroupLocationInput,
  UpdateGroupDivisionInput,
  UpdateTicketWindowInput,
} from '@/modules/shows/schemas';

const message = readableError;

export function useUpdateTicketWindow() {
  const router = useRouter();

  return useMutation({
    mutationFn: (input: UpdateTicketWindowInput) => updateTicketWindow(input),
    onSuccess: () => {
      toast.success('Ticket sales window saved');
      router.refresh();
    },
    onError: (error) => {
      toast.error(message(error, 'Could not save the ticket sales window'));
    },
  });
}

export function useAddCatalogGroup() {
  const router = useRouter();

  return useMutation({
    mutationFn: (input: AddCatalogGroupInput) => addCatalogGroup(input),
    onSuccess: ({ added }, { group }) => {
      toast.success(
        added === 0
          ? `${group} was already on this show`
          : `${group} added — ${String(added)} ${added === 1 ? 'class' : 'classes'}`,
      );
      router.refresh();
    },
    onError: (error) => {
      toast.error(message(error, 'Could not add these classes'));
    },
  });
}

export function useRemoveCatalogGroup() {
  const router = useRouter();

  return useMutation({
    mutationFn: (input: { showId: string; group: string }) => removeCatalogGroup(input),
    onSuccess: (_data, { group }) => {
      toast.success(`${group} removed`);
      router.refresh();
    },
    onError: (error) => {
      toast.error(message(error, 'Could not remove these classes'));
    },
  });
}

export function useUpdateGroupLocation() {
  const router = useRouter();

  return useMutation({
    mutationFn: (input: UpdateGroupLocationInput) => updateGroupLocation(input),
    onSuccess: () => {
      toast.success('Location saved');
      router.refresh();
    },
    onError: (error) => {
      toast.error(message(error, 'Could not save this location'));
    },
  });
}

export function useUpdateGroupDivision() {
  const router = useRouter();

  return useMutation({
    mutationFn: (input: UpdateGroupDivisionInput) => updateGroupDivision(input),
    onSuccess: () => {
      toast.success('Division saved');
      router.refresh();
    },
    onError: (error) => {
      toast.error(message(error, 'Could not save this division'));
    },
  });
}

export function useAddCustomClass(options?: { onSuccess?: () => void }) {
  const router = useRouter();

  return useMutation({
    mutationFn: (input: AddCustomClassInput) => addCustomClass(input),
    onSuccess: () => {
      toast.success('Class added');
      router.refresh();
      options?.onSuccess?.();
    },
    onError: (error) => {
      toast.error(message(error, 'Could not add the class'));
    },
  });
}

export function useCreateTocClass(options?: { onSuccess?: () => void }) {
  const router = useRouter();

  return useMutation({
    mutationFn: (input: CreateTocClassInput) => createTocClass(input),
    onSuccess: () => {
      toast.success('Test of Choice created');
      router.refresh();
      options?.onSuccess?.();
    },
    onError: (error) => {
      toast.error(message(error, 'Could not create the Test of Choice'));
    },
  });
}

export function useAddQualTypePreset() {
  const router = useRouter();

  return useMutation({
    mutationFn: (input: AddQualTypePresetInput) => addQualTypePreset(input),
    onSuccess: (_data, { body }) => {
      toast.success(`${body} qualifying fee added — enable it on Event Sales to put it on sale`);
      router.refresh();
    },
    onError: (error) => {
      toast.error(message(error, 'Could not add the qualifying type'));
    },
  });
}

// ── Offered classes table (per-test) ────────────────────────────────────
// Quiet on success — these are inline edits the row already reflects — and
// loud on failure, which is usually the entries guard.

export function useSetTestDivision() {
  const router = useRouter();
  return useMutation({
    mutationFn: (input: SetTestDivisionInput) => setTestDivision(input),
    onSuccess: () => {
      router.refresh();
    },
    onError: (error) => {
      toast.error(message(error, 'Could not change the division'));
    },
  });
}

export function useUpdateTestFee() {
  const router = useRouter();
  return useMutation({
    mutationFn: (input: UpdateTestFeeInput) => updateTestFee(input),
    onSuccess: () => {
      router.refresh();
    },
    onError: (error) => {
      toast.error(message(error, 'Could not save the price'));
    },
  });
}

export function useSetTestQualifying() {
  const router = useRouter();
  return useMutation({
    mutationFn: (input: SetTestQualifyingInput) => setTestQualifying(input),
    onSuccess: () => {
      router.refresh();
    },
    onError: (error) => {
      toast.error(message(error, 'Could not update qualifying'));
    },
  });
}

export function useRemoveTestClasses() {
  const router = useRouter();
  return useMutation({
    mutationFn: (input: RemoveTestClassesInput & { name: string }) =>
      removeTestClasses({ showId: input.showId, classIds: input.classIds }),
    onSuccess: (_data, { name }) => {
      toast.success(`${name} removed`);
      router.refresh();
    },
    onError: (error) => {
      toast.error(message(error, 'Could not remove this test'));
    },
  });
}

// ── Catalog picker (offer / withdraw whole tests) ───────────────────────

export interface OfferCatalogTestsInput {
  showId: string;
  tests: { category: string; group: string; test: string }[];
  /** One entry per division to offer in; empty → one division-less class. */
  divisions: { name: string; fee: number }[];
  /** Used when `divisions` is empty. */
  fee: number;
  location: string;
  /** Label for the success toast on bulk adds ("FEI"). */
  label?: string;
}

/** Offers catalog tests through the existing addCatalogGroup action — one
 * call per catalog group × division, the same rows the level picker wrote. */
export function useOfferCatalogTests() {
  const router = useRouter();

  return useMutation({
    mutationFn: async (input: OfferCatalogTestsInput) => {
      const byGroup = new Map<string, { category: string; group: string; tests: string[] }>();
      for (const t of input.tests) {
        const k = `${t.category}::${t.group}`;
        const entry = byGroup.get(k) ?? { category: t.category, group: t.group, tests: [] };
        entry.tests.push(t.test);
        byGroup.set(k, entry);
      }
      const targets =
        input.divisions.length > 0
          ? input.divisions
          : [{ name: undefined as string | undefined, fee: input.fee }];
      const results = await Promise.all(
        [...byGroup.values()].flatMap(({ category, group, tests }) =>
          targets.map((d) =>
            addCatalogGroup({
              showId: input.showId,
              category,
              group,
              division: d.name,
              tests,
              fee: d.fee,
              location: input.location,
            }),
          ),
        ),
      );
      return results.reduce((sum, r) => sum + r.added, 0);
    },
    onSuccess: (added, { tests, label }) => {
      if (tests.length > 1) {
        toast.success(
          added === 0
            ? `${label ?? 'These tests'} already offered`
            : `${label ? `${label}: ` : ''}${String(tests.length)} tests offered`,
        );
      }
      router.refresh();
    },
    onError: (error) => {
      toast.error(message(error, 'Could not add these tests'));
      router.refresh();
    },
  });
}

export interface WithdrawOfferedTestsInput {
  showId: string;
  tests: { name: string; classIds: string[] }[];
}

/** Un-offers tests one by one; any with entries stay (the server refuses)
 * and the existing blocked message is shown. */
export function useWithdrawOfferedTests() {
  const router = useRouter();

  return useMutation({
    mutationFn: async ({ showId, tests }: WithdrawOfferedTestsInput) => {
      const results = await Promise.allSettled(
        tests.map((t) => removeTestClasses({ showId, classIds: t.classIds })),
      );
      const failed = results.filter((r): r is PromiseRejectedResult => r.status === 'rejected');
      if (failed.length > 0) {
        if (tests.length === 1) throw failed[0]?.reason;
        throw new Error(
          `${String(failed.length)} of ${String(tests.length)} tests have entries (scratched entries count too) and were kept.`,
        );
      }
    },
    onSuccess: (_data, { tests }) => {
      if (tests.length > 1) toast.success(`${String(tests.length)} tests removed`);
      router.refresh();
    },
    onError: (error) => {
      toast.error(message(error, 'Could not remove this test'));
      router.refresh();
    },
  });
}

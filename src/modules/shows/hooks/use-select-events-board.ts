'use client';

import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { GOVERNING_BODIES, type GoverningBody } from '@/modules/shows/constants';
import {
  feeForNewTest,
  groupColor,
  groupOfferedClasses,
  orderedDivisions,
  selectEventsStats,
  type OfferedTest,
} from '@/modules/shows/offered-classes';
import { TEST_CATALOG, levelStyle, type CatalogTest } from '@/modules/shows/test-catalog';
import type { SelectEventsData } from '@/modules/shows/types';
import { formatMoney } from '@/shared/lib/format/currency';
import { sanitizeDecimalInput } from '@/shared/lib/format/number-input';
import {
  useOfferCatalogTests,
  useWithdrawOfferedTests,
} from '@/modules/shows/hooks/use-select-events-mutations';

export type PickerFilter = 'All' | GoverningBody;

export interface PickerRow {
  test: CatalogTest;
  on: boolean;
  pending: boolean;
  priceLabel: string;
  levelName: string;
  levelColor: string;
}

export interface PickerGroup {
  body: GoverningBody;
  color: string;
  rows: PickerRow[];
  onCount: number;
  allOn: boolean;
}

/** Everything the Select Events tab needs: the offered table, its stats, the
 * "Add all" body buttons and the catalog picker's state and actions. */
export function useSelectEventsBoard(data: SelectEventsData) {
  const sections = useMemo(() => groupOfferedClasses(data), [data]);
  const stats = useMemo(() => selectEventsStats(data, sections), [data, sections]);
  const divisions = useMemo(() => orderedDivisions(data.divisions), [data.divisions]);

  const offeredByCatalogKey = useMemo(() => {
    const map = new Map<string, OfferedTest>();
    for (const s of sections) for (const t of s.tests) if (t.catalogKey) map.set(t.catalogKey, t);
    return map;
  }, [sections]);

  const catalogBodies = GOVERNING_BODIES.filter((b) => TEST_CATALOG.some((t) => t.body === b));

  // ── Picker UI state ──
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState<PickerFilter>('All');
  const [query, setQuery] = useState('');
  const [defaultDivisions, setDefaultDivisions] = useState<Set<string>>(
    () => new Set(data.divisions.map((d) => d.name)),
  );
  const [ring, setRing] = useState('');
  const [price, setPriceRaw] = useState('');

  // Optimistic tick state, cleared once fresh server data arrives.
  const [optimistic, setOptimistic] = useState<Map<string, boolean>>(new Map());
  const [prevClasses, setPrevClasses] = useState(data.classes);
  if (prevClasses !== data.classes) {
    setPrevClasses(data.classes);
    setOptimistic(new Map());
  }

  const offer = useOfferCatalogTests();
  const withdraw = useWithdrawOfferedTests();

  const typedNumber = Number(price);
  const typedPrice = price.trim() === '' || !Number.isFinite(typedNumber) ? null : typedNumber;
  const chosenDivisions = divisions.filter((d) => defaultDivisions.has(d.name));
  const previewFee = feeForNewTest(chosenDivisions[0], typedPrice);

  function setPending(keys: string[], on: boolean) {
    setOptimistic((prev) => {
      const next = new Map(prev);
      for (const k of keys) next.set(k, on);
      return next;
    });
  }
  function clearPending(keys: string[]) {
    setOptimistic((prev) => {
      const next = new Map(prev);
      for (const k of keys) next.delete(k);
      return next;
    });
  }

  function offerTests(tests: CatalogTest[], opts: { useDefaults: boolean; label?: string }) {
    if (tests.length === 0) return;
    const divs = opts.useDefaults ? divisions : chosenDivisions;
    const fee = opts.useDefaults ? null : typedPrice;
    const keys = tests.map((t) => t.key);
    setPending(keys, true);
    offer.mutate(
      {
        showId: data.showId,
        tests: tests.map((t) => ({ category: t.category, group: t.group, test: t.test })),
        divisions: divs.map((d) => ({ name: d.name, fee: feeForNewTest(d, fee) })),
        fee: feeForNewTest(undefined, fee),
        location: opts.useDefaults ? '' : ring,
        label: opts.label,
      },
      {
        onError: () => {
          clearPending(keys);
        },
      },
    );
  }

  function withdrawTests(tests: CatalogTest[]) {
    const offered = tests
      .map((t) => ({ t, o: offeredByCatalogKey.get(t.key) }))
      .filter((x): x is { t: CatalogTest; o: OfferedTest } => !!x.o);
    if (offered.length === 0) return;
    const keys = offered.map((x) => x.t.key);
    setPending(keys, false);
    withdraw.mutate(
      {
        showId: data.showId,
        tests: offered.map(({ o }) => ({ name: o.test, classIds: o.classes.map((c) => c.id) })),
      },
      {
        onError: () => {
          clearPending(keys);
        },
      },
    );
  }

  const isOn = (t: CatalogTest) => optimistic.get(t.key) ?? offeredByCatalogKey.has(t.key);

  const q = query.trim().toLowerCase();
  const matches = (t: CatalogTest) =>
    (filter === 'All' || t.body === filter) &&
    (!q || `${t.name} ${t.code} ${t.group}`.toLowerCase().includes(q));

  const groups: PickerGroup[] = catalogBodies
    .filter((b) => filter === 'All' || b === filter)
    .map((body) => {
      const rows = TEST_CATALOG.filter((t) => t.body === body && matches(t)).map((test) => {
        const on = isOn(test);
        const offeredTest = offeredByCatalogKey.get(test.key);
        const lvl = levelStyle(test.level);
        return {
          test,
          on,
          pending: optimistic.has(test.key),
          priceLabel: formatMoney(offeredTest?.fee ?? previewFee),
          levelName: lvl.name,
          levelColor: lvl.color,
        };
      });
      const onCount = rows.filter((r) => r.on).length;
      return {
        body,
        color: groupColor(body),
        rows,
        onCount,
        allOn: rows.length > 0 && onCount === rows.length,
      };
    })
    .filter((g) => g.rows.length > 0);

  const chips: { key: PickerFilter; count: number }[] = [
    { key: 'All', count: TEST_CATALOG.length },
    ...catalogBodies.map((b) => ({
      key: b,
      count: TEST_CATALOG.filter((t) => t.body === b).length,
    })),
  ];

  return {
    sections,
    stats,
    divisions,
    catalogBodies,
    bodyColor: groupColor,
    busy: offer.isPending || withdraw.isPending,

    /** Header "Add all: FEI" — every not-yet-offered test of that body, in
     * every show division at the division's default price. */
    addAllBody(body: GoverningBody) {
      const missing = TEST_CATALOG.filter((t) => t.body === body && !isOn(t));
      if (missing.length === 0) {
        toast.info(`Every ${body} test is already offered`);
        return;
      }
      offerTests(missing, { useDefaults: true, label: body });
    },

    picker: {
      open,
      openPicker: () => {
        setOpen(true);
      },
      closePicker: () => {
        setOpen(false);
      },
      filter,
      setFilter,
      query,
      setQuery,
      chips,
      groups,
      offeredCount: stats.testCount,
      defaults: {
        divisions,
        isDivisionOn: (name: string) => defaultDivisions.has(name),
        toggleDivision: (name: string) => {
          setDefaultDivisions((prev) => {
            const next = new Set(prev);
            if (next.has(name)) next.delete(name);
            else next.add(name);
            return next;
          });
        },
        ringNames: data.ringNames,
        ring,
        setRing,
        price,
        setPrice: (raw: string) => {
          setPriceRaw(sanitizeDecimalInput(raw, { maxIntegerDigits: 6 }));
        },
        pricePlaceholder: String(feeForNewTest(chosenDivisions[0], null)),
      },
      toggle(row: PickerRow) {
        if (row.on) withdrawTests([row.test]);
        else offerTests([row.test], { useDefaults: false });
      },
      toggleGroup(group: PickerGroup) {
        const tests = group.rows.map((r) => r.test);
        if (group.allOn) withdrawTests(tests);
        else
          offerTests(
            group.rows.filter((r) => !r.on).map((r) => r.test),
            { useDefaults: false, label: group.body },
          );
      },
    },
  };
}

export type SelectEventsBoard = ReturnType<typeof useSelectEventsBoard>;
export type CatalogPickerState = SelectEventsBoard['picker'];

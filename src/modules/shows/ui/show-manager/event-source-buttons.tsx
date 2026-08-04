'use client';

import { useState } from 'react';
import { Loader2Icon } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/shadcn/dialog';
import { cn } from '@/shared/lib/utils';
import {
  CATALOG_DIVISIONS,
  DEFAULT_CLASS_FEE,
  EVENT_SOURCE_BUTTONS,
  FM_SETS,
  QUAL_TYPE_PRESETS,
  type FmSetName,
} from '../../constants';
import type { SelectEventsData } from '../../data/setup-queries';
import {
  useAddCatalogGroup,
  useAddCustomClass,
  useAddQualTypePreset,
  useCreateTocClass,
} from '../../hooks/use-select-events-mutations';
import { SM_LABEL, SM_INPUT, SM_SELECT, SM_GREEN_BTN, SM_GHOST_BTN } from './tokens';

const PILL =
  'rounded-full border border-[#D9E1DD] bg-white px-[15px] py-2 text-[12.5px] font-semibold ' +
  'text-[#16261F] transition-colors hover:border-[#16261F] disabled:opacity-60';

/**
 * The two button rows above the catalog.
 *
 * The first row is how classes get onto a show by a route other than the
 * catalog below: a governing body's published set, a Test of Choice, or one
 * typed by hand. The second adds a qualifying fee.
 *
 * "+ Independent" opens with nothing in it and says so, rather than being
 * hidden — those tests come from an organization's Test Builder library, and
 * the design states the empty case outright.
 */
export function EventSourceButtons({ data }: { data: SelectEventsData }) {
  const [fmSet, setFmSet] = useState<FmSetName | null>(null);
  const [tocOpen, setTocOpen] = useState(false);
  const [customOpen, setCustomOpen] = useState(false);

  const addQual = useAddQualTypePreset();

  return (
    <>
      <div className="mb-2.5 flex flex-wrap items-center gap-2">
        {EVENT_SOURCE_BUTTONS.map((name) => (
          <button
            key={name}
            type="button"
            className={PILL}
            onClick={() => {
              if (name === '+ Test of Choice (TOC)') setTocOpen(true);
              else if (name === '+ Add Custom Class') setCustomOpen(true);
              else setFmSet(name);
            }}
          >
            {name}
          </button>
        ))}
      </div>

      <div className="mb-5 flex flex-wrap items-center gap-2">
        {QUAL_TYPE_PRESETS.map(({ body, price }) => (
          <button
            key={body}
            type="button"
            className={PILL}
            disabled={addQual.isPending}
            onClick={() => {
              addQual.mutate({ showId: data.showId, body, price });
            }}
          >
            + {body} (${price})
          </button>
        ))}
      </div>

      {fmSet && (
        <FmSetDialog
          key={fmSet}
          setName={fmSet}
          data={data}
          onClose={() => {
            setFmSet(null);
          }}
        />
      )}
      {tocOpen && (
        <TocDialog
          data={data}
          onClose={() => {
            setTocOpen(false);
          }}
        />
      )}
      {customOpen && (
        <CustomClassDialog
          data={data}
          onClose={() => {
            setCustomOpen(false);
          }}
        />
      )}
    </>
  );
}

/** One checkbox's identity: a specific test within a level, paired with a rider division. */
function catalogKey(levelName: string, test: string, division: string): string {
  return `${levelName}::${test}::${division}`;
}

/**
 * "Include FEI classes" / "Include USEF/USDF classes" / "Include your own
 * tests" — ported from showstaff.html's ensureSmBulkModal/buildSmBulkPanel
 * (~3885-4000). Every level defaults fully checked, same as legacy, so an
 * organizer running everything just hits Save; one skips only the divisions
 * they don't run.
 *
 * The division checkboxes are per TEST, not per level — legacy's
 * buildSmBulkPanel renders one `sm-bulk-cb` per (test, division), so e.g.
 * Training Level Test 1 can run for Junior Rider only while Test 3 runs for
 * all three. The level's own checkbox is a toggle-all for every test and
 * division under it (smBulkToggleGroup), not a fourth, coarser selection.
 */
function FmSetDialog({
  setName,
  data,
  onClose,
}: {
  setName: FmSetName;
  data: SelectEventsData;
  onClose: () => void;
}) {
  const levels = FM_SETS[setName];
  const allKeys = () =>
    new Set(
      levels.flatMap((lv) =>
        lv.tests.flatMap((test) => CATALOG_DIVISIONS.map((d) => catalogKey(lv.name, test, d)))
      )
    );
  const [picked, setPicked] = useState<Set<string>>(allKeys);
  const [saving, setSaving] = useState(false);
  const add = useAddCatalogGroup();

  const title =
    setName === '+ Independent'
      ? 'Include your own tests'
      : `Include ${setName.replace('+ ', '')} classes`;

  function toggle(key: string, checked: boolean) {
    setPicked((prev) => {
      const next = new Set(prev);
      if (checked) next.add(key);
      else next.delete(key);
      return next;
    });
  }

  function toggleLevel(level: (typeof levels)[number], checked: boolean) {
    setPicked((prev) => {
      const next = new Set(prev);
      for (const test of level.tests) {
        for (const division of CATALOG_DIVISIONS) {
          const key = catalogKey(level.name, test, division);
          if (checked) next.add(key);
          else next.delete(key);
        }
      }
      return next;
    });
  }

  async function save() {
    // Tests sharing a division within one level still batch into a single
    // mutation call (addCatalogGroup inserts one class per test it's given),
    // but which tests land in which call now follows the actual per-test
    // checkboxes rather than assuming a whole level moves together.
    const calls = levels.flatMap((level) =>
      CATALOG_DIVISIONS.map((division) => ({
        level,
        division,
        tests: level.tests.filter((test) => picked.has(catalogKey(level.name, test, division))),
      })).filter((call) => call.tests.length > 0)
    );
    if (calls.length === 0) {
      onClose();
      return;
    }

    // One at a time, not Promise.all/fire-and-forget: each success calls
    // router.refresh(), and firing several of those concurrently was
    // observed dropping classes from calls other than the one whose refresh
    // "won" — a real, reproducible bug, not a hypothetical one. Sequencing
    // them means only one refresh is ever in flight.
    //
    // One call failing doesn't stop the rest, same as legacy's
    // saveSmBulkSelection — the toast from useAddCatalogGroup's onError
    // already reports it, and a rider whose division didn't fail shouldn't
    // also lose theirs because a different one did.
    setSaving(true);
    try {
      for (const { level, division, tests } of calls) {
        await add.mutateAsync({
          showId: data.showId,
          category: setName.replace('+ ', ''),
          group: level.name,
          division,
          tests,
          fee: DEFAULT_CLASS_FEE,
          location: '',
        }).catch(() => undefined);
      }
    } finally {
      setSaving(false);
    }
    onClose();
  }

  return (
    <Dialog
      open
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
    >
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>Tick the tests and divisions you&apos;re running, then save.</DialogDescription>
        </DialogHeader>

        {levels.length === 0 ? (
          <p className="py-4 text-[13.5px] text-[#7A8781]">
            No organization has built an Independent test yet.
          </p>
        ) : (
          <>
            <div className="mb-2 flex gap-2">
              <button
                type="button"
                className={SM_GHOST_BTN}
                onClick={() => {
                  setPicked(allKeys());
                }}
              >
                Select all
              </button>
              <button
                type="button"
                className={SM_GHOST_BTN}
                onClick={() => {
                  setPicked(new Set());
                }}
              >
                Deselect all
              </button>
            </div>

            <div className="flex flex-col gap-2">
              {levels.map((level) => {
                const levelKeys = level.tests.flatMap((test) =>
                  CATALOG_DIVISIONS.map((d) => catalogKey(level.name, test, d))
                );
                const allChecked = levelKeys.every((k) => picked.has(k));

                return (
                  <div
                    key={level.name}
                    className="rounded-[10px] border border-[#EDF0EE] px-3.5 py-2.5"
                  >
                    <label className="flex cursor-pointer items-center gap-3">
                      <input
                        type="checkbox"
                        className="size-4 flex-none accent-[#1A5B3C]"
                        checked={allChecked}
                        onChange={(e) => {
                          toggleLevel(level, e.target.checked);
                        }}
                      />
                      <span className="text-[13.5px] font-semibold text-ink-deep">{level.name}</span>
                    </label>

                    <div className="mt-2 flex flex-col gap-2 pl-7">
                      {level.tests.map((test) => (
                        <div
                          key={test}
                          className="border-t border-[#EEF2F0] pt-2 first:border-t-0 first:pt-0"
                        >
                          <div className="mb-1 text-[13px] font-semibold text-ink-deep">{test}</div>
                          <div className="flex flex-wrap gap-x-4 gap-y-1.5">
                            {CATALOG_DIVISIONS.map((division) => {
                              const key = catalogKey(level.name, test, division);
                              return (
                                <label
                                  key={division}
                                  className="flex cursor-pointer items-center gap-1.5 text-[12.5px] text-[#5A6B63]"
                                >
                                  <input
                                    type="checkbox"
                                    className="size-3.5 flex-none accent-[#1A5B3C]"
                                    checked={picked.has(key)}
                                    onChange={(e) => {
                                      toggle(key, e.target.checked);
                                    }}
                                  />
                                  {division}
                                </label>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        <DialogFooter>
          <button type="button" className={SM_GHOST_BTN} onClick={onClose}>
            Cancel
          </button>
          {levels.length > 0 && (
            <button
              type="button"
              className={SM_GREEN_BTN}
              disabled={saving}
              onClick={() => {
                void save();
              }}
            >
              {saving && <Loader2Icon className="size-4 animate-spin" aria-hidden />}
              Save selected
            </button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function CustomClassDialog({ data, onClose }: { data: SelectEventsData; onClose: () => void }) {
  const [name, setName] = useState('');
  const [division, setDivision] = useState('');
  const [fee, setFee] = useState(String(DEFAULT_CLASS_FEE));

  const add = useAddCustomClass({ onSuccess: onClose });
  const divisions = [...new Set(data.classes.map((c) => c.division).filter((d): d is string => !!d))];

  return (
    <Dialog
      open
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
    >
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Add Custom Class</DialogTitle>
          <DialogDescription>
            A one-off class of your own — it scores and places like any other.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label htmlFor="cc-name" className={SM_LABEL}>
              Class name
            </label>
            <input
              id="cc-name"
              className={SM_INPUT}
              placeholder="e.g. Sponsor Exhibition Class"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
              }}
            />
          </div>

          <div>
            <label htmlFor="cc-division" className={SM_LABEL}>
              Division (optional)
            </label>
            <select
              id="cc-division"
              className={SM_SELECT}
              value={division}
              onChange={(e) => {
                setDivision(e.target.value);
              }}
            >
              <option value="">—</option>
              {divisions.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="cc-fee" className={SM_LABEL}>
              Entry fee
            </label>
            <input
              id="cc-fee"
              type="number"
              min={0}
              className={SM_INPUT}
              value={fee}
              onChange={(e) => {
                setFee(e.target.value);
              }}
            />
          </div>
        </div>

        <DialogFooter>
          <button type="button" className={SM_GHOST_BTN} onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className={SM_GREEN_BTN}
            disabled={add.isPending || name.trim().length < 2}
            onClick={() => {
              add.mutate({ showId: data.showId, name, division, fee });
            }}
          >
            {add.isPending && <Loader2Icon className="size-4 animate-spin" aria-hidden />}
            Add Class
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * "Test of Choice" — the rider picks which test they ride from a shortlist the
 * organizer assembles here.
 *
 * The shortlist is drawn from the USEF/USDF set, which is what the legacy
 * build's TOC modal offered; the design's "Your test library" tab needs an
 * organization Test Builder library that does not exist yet, so only the
 * catalog side is offered rather than an empty tab that looks broken.
 */
function TocDialog({ data, onClose }: { data: SelectEventsData; onClose: () => void }) {
  const [name, setName] = useState('Test of Choice');
  const [division, setDivision] = useState('');
  const [fee, setFee] = useState(String(DEFAULT_CLASS_FEE));
  const [query, setQuery] = useState('');
  const [picked, setPicked] = useState<Set<string>>(new Set());

  const create = useCreateTocClass({ onSuccess: onClose });
  const divisions = [...new Set(data.classes.map((c) => c.division).filter((d): d is string => !!d))];

  const options = FM_SETS['+ USEF/USDF'].flatMap((lv) =>
    lv.tests.map((test) => `${lv.name} — ${test}`)
  );
  const filtered = options.filter((o) => o.toLowerCase().includes(query.trim().toLowerCase()));

  return (
    <Dialog
      open
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
    >
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>Test of Choice</DialogTitle>
          <DialogDescription>
            One class, several tests. Riders choose which of them they ride when they enter.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label htmlFor="toc-name" className={SM_LABEL}>
              Name
            </label>
            <input
              id="toc-name"
              className={SM_INPUT}
              placeholder="e.g. TOC — Freestyle Fun Night"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
              }}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="toc-division" className={SM_LABEL}>
                Division
              </label>
              <select
                id="toc-division"
                className={SM_SELECT}
                value={division}
                onChange={(e) => {
                  setDivision(e.target.value);
                }}
              >
                <option value="">—</option>
                {divisions.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="toc-fee" className={SM_LABEL}>
                Entry fee
              </label>
              <input
                id="toc-fee"
                type="number"
                min={0}
                className={SM_INPUT}
                value={fee}
                onChange={(e) => {
                  setFee(e.target.value);
                }}
              />
            </div>
          </div>

          <div>
            <label htmlFor="toc-search" className={SM_LABEL}>
              Catalog — {picked.size} selected
            </label>
            <input
              id="toc-search"
              className={cn(SM_INPUT, 'mb-2')}
              placeholder="Search tests…"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
              }}
            />

            {filtered.length === 0 ? (
              <p className="py-3 text-[13px] text-[#7A8781]">No tests match that search.</p>
            ) : (
              <div className="max-h-[220px] overflow-y-auto rounded-[10px] border border-[#EDF0EE]">
                {filtered.map((option) => (
                  <label
                    key={option}
                    className="flex cursor-pointer items-center gap-2.5 border-b border-[#F1F4F3] px-3 py-2 last:border-b-0"
                  >
                    <input
                      type="checkbox"
                      className="size-4 flex-none accent-[#1A5B3C]"
                      checked={picked.has(option)}
                      onChange={(e) => {
                        setPicked((prev) => {
                          const next = new Set(prev);
                          if (e.target.checked) next.add(option);
                          else next.delete(option);
                          return next;
                        });
                      }}
                    />
                    <span className="text-[12.5px] text-ink-deep">{option}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <button type="button" className={SM_GHOST_BTN} onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className={SM_GREEN_BTN}
            disabled={create.isPending || picked.size === 0 || name.trim().length < 2}
            onClick={() => {
              create.mutate({
                showId: data.showId,
                name,
                division,
                fee,
                testOptions: [...picked],
              });
            }}
          >
            {create.isPending && <Loader2Icon className="size-4 animate-spin" aria-hidden />}
            Create Test of Choice
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

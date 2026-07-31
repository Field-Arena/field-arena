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

/** "Include FEI classes" / "Include USEF/USDF classes" / "Include your own tests". */
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
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const add = useAddCatalogGroup();

  const title =
    setName === '+ Independent'
      ? 'Include your own tests'
      : `Include ${setName.replace('+ ', '')} classes`;

  function save() {
    // One call per level: each becomes its own division, the same unit the
    // catalog below works in.
    const chosen = levels.filter((lv) => picked.has(lv.name));
    if (chosen.length === 0) {
      onClose();
      return;
    }
    let remaining = chosen.length;
    for (const level of chosen) {
      add.mutate(
        {
          showId: data.showId,
          category: setName.replace('+ ', ''),
          group: level.name,
          tests: [...level.tests],
          fee: DEFAULT_CLASS_FEE,
          location: '',
        },
        {
          onSettled: () => {
            remaining -= 1;
            if (remaining === 0) onClose();
          },
        }
      );
    }
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
          <DialogDescription>
            Each level you check is added as a division, with one class per test in it.
          </DialogDescription>
        </DialogHeader>

        {levels.length === 0 ? (
          <p className="py-4 text-[13.5px] text-[#7A8781]">
            No organization has built an Independent test yet.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {levels.map((level) => (
              <label
                key={level.name}
                className="flex cursor-pointer items-start gap-3 rounded-[10px] border border-[#EDF0EE] px-3.5 py-2.5"
              >
                <input
                  type="checkbox"
                  className="mt-0.5 size-4 flex-none accent-[#1A5B3C]"
                  checked={picked.has(level.name)}
                  onChange={(e) => {
                    setPicked((prev) => {
                      const next = new Set(prev);
                      if (e.target.checked) next.add(level.name);
                      else next.delete(level.name);
                      return next;
                    });
                  }}
                />
                <span className="min-w-0">
                  <span className="block text-[13.5px] font-semibold text-ink-deep">
                    {level.name}
                  </span>
                  <span className="block text-[12px] text-[#7A8781]">{level.tests.join(' · ')}</span>
                </span>
              </label>
            ))}
          </div>
        )}

        <DialogFooter>
          <button type="button" className={SM_GHOST_BTN} onClick={onClose}>
            Cancel
          </button>
          {levels.length > 0 && (
            <button type="button" className={SM_GREEN_BTN} disabled={add.isPending} onClick={save}>
              {add.isPending && <Loader2Icon className="size-4 animate-spin" aria-hidden />}
              Add selected
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

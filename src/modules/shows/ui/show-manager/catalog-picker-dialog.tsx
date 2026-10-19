'use client';

import type { CatalogPickerState } from '@/modules/shows/hooks/use-select-events-board';
import { divisionShort } from '@/modules/shows/offered-classes';
import { BodyPill, LevelPill } from '@/modules/shows/ui/show-manager/level-pill';

/** "Add tests from catalog" — the prototype's picker (organizer.html
 * #pickerOverlay): search, body filter chips, per-body groups with add-all,
 * and one checkable row per test. Ticking offers / un-offers immediately. */
export function CatalogPickerDialog({ picker }: { picker: CatalogPickerState }) {
  const { defaults } = picker;

  return (
    <div
      className="fa-modal-overlay fa-open"
      role="dialog"
      aria-modal="true"
      aria-label="Add tests from catalog"
      onClick={(e) => {
        if (e.target === e.currentTarget) picker.closePicker();
      }}
      onKeyDown={(e) => {
        if (e.key === 'Escape') picker.closePicker();
      }}
    >
      <div className="fa-modal">
        <div className="fa-modal-head">
          <div>
            <h3>Add tests from catalog</h3>
            <div className="fa-mh-sub">
              Browse FEI, USEF &amp; USDF — check any test to offer it in this show
            </div>
          </div>
          <button
            type="button"
            className="fa-modal-x"
            aria-label="Close"
            onClick={picker.closePicker}
          >
            <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>

        <div className="fa-pick-toolbar">
          <div className="fa-mini-search flex-1">
            <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden>
              <circle cx="11" cy="11" r="7" />
              <path d="M21 21l-4.3-4.3" strokeLinecap="round" />
            </svg>
            <input
              placeholder="Search tests…"
              aria-label="Search tests"
              className="!w-full"
              value={picker.query}
              onChange={(e) => {
                picker.setQuery(e.target.value);
              }}
            />
          </div>
          <div className="fa-filterbar">
            {picker.chips.map((chip) => (
              <button
                key={chip.key}
                type="button"
                className={`fa-chip ${picker.filter === chip.key ? 'fa-active' : ''}`}
                aria-pressed={picker.filter === chip.key}
                onClick={() => {
                  picker.setFilter(chip.key);
                }}
              >
                {chip.key} <span className="fa-ct">{chip.count}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-[var(--fa-line-soft)] bg-[var(--fa-surface-2)] px-5 py-2 text-[11.5px] text-[var(--fa-ink-3)]">
          <span className="font-semibold">New tests get:</span>
          {defaults.divisions.length > 0 && (
            <span className="inline-flex items-center gap-1.5">
              Divisions
              <span className="fa-divsel">
                {defaults.divisions.map((d) => {
                  const on = defaults.isDivisionOn(d.name);
                  return (
                    <button
                      key={d.id}
                      type="button"
                      title={d.name}
                      aria-pressed={on}
                      className={`fa-divmini ${on ? 'fa-on' : ''}`}
                      onClick={() => {
                        defaults.toggleDivision(d.name);
                      }}
                    >
                      {divisionShort(d.name)}
                    </button>
                  );
                })}
              </span>
            </span>
          )}
          <label className="inline-flex items-center gap-1.5">
            Ring
            <select
              value={defaults.ring}
              aria-label="Ring for new tests"
              className="h-[28px] rounded-[7px] border border-[var(--fa-line)] bg-[var(--fa-surface)] px-1.5 text-[12px] text-[var(--fa-ink)]"
              onChange={(e) => {
                defaults.setRing(e.target.value);
              }}
            >
              <option value="">Not set</option>
              {defaults.ringNames.map((ring) => (
                <option key={ring} value={ring}>
                  {ring}
                </option>
              ))}
            </select>
          </label>
          <label className="inline-flex items-center gap-1.5">
            Price
            <span className="fa-prefix-input fa-pi-sm inline-flex items-center rounded-[7px] border border-[var(--fa-line)] bg-[var(--fa-surface)]">
              <span>$</span>
              <input
                type="text"
                inputMode="decimal"
                aria-label="Price for new tests"
                placeholder={defaults.pricePlaceholder}
                value={defaults.price}
                className="border-0 bg-transparent text-[var(--fa-ink)] outline-none"
                onChange={(e) => {
                  defaults.setPrice(e.target.value);
                }}
              />
            </span>
          </label>
        </div>

        <div className="fa-modal-body">
          {picker.groups.length === 0 ? (
            <div className="fa-cat-empty p-10 text-center text-[13px] text-[var(--fa-ink-3)]">
              No tests match your search.
            </div>
          ) : (
            picker.groups.map((group) => (
              <div key={group.body}>
                <div className="fa-pick-group-head">
                  <div className="fa-pgh-l">
                    <BodyPill label={group.body} color={group.color} />
                    <b>{group.body}</b>
                    <span className="fa-pg-count">
                      {group.onCount} of {group.rows.length}
                    </span>
                  </div>
                  <button
                    type="button"
                    className={`fa-pk-addall ${group.allOn ? 'fa-alloff' : ''}`}
                    onClick={() => {
                      picker.toggleGroup(group);
                    }}
                  >
                    {group.allOn ? 'Remove all' : `Add all ${String(group.rows.length)}`}
                  </button>
                </div>
                {group.rows.map((row) => (
                  <div
                    key={row.test.key}
                    role="checkbox"
                    aria-checked={row.on}
                    tabIndex={0}
                    className={`fa-pick-row ${row.on ? 'fa-on' : ''} ${row.pending ? 'opacity-70' : ''}`}
                    onClick={() => {
                      picker.toggle(row);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === ' ' || e.key === 'Enter') {
                        e.preventDefault();
                        picker.toggle(row);
                      }
                    }}
                  >
                    <span className="fa-pick-check">
                      <svg
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                        viewBox="0 0 24 24"
                        aria-hidden
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 12l5 5L20 7" />
                      </svg>
                    </span>
                    <div className="fa-pk-body">
                      <b>{row.test.name}</b>
                      <div className="fa-pk-sub">
                        <LevelPill name={row.levelName} color={row.levelColor} />
                        <span className="fa-tag-usef">{row.test.code}</span>
                        <span className="text-[11.5px] text-[var(--fa-ink-3)]">
                          {row.priceLabel}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ))
          )}
        </div>

        <div className="fa-modal-foot">
          <span className="text-[13px] text-[var(--fa-ink-2)]">
            <b>{picker.offeredCount}</b> classes offered
          </span>
          <button type="button" className="fa-btn fa-btn-primary" onClick={picker.closePicker}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

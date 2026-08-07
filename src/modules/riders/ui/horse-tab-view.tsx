'use client';

import { useState, type CSSProperties } from 'react';
import { useCreateHorse, useDeleteHorse, useUpdateHorse } from '../hooks/use-horse-mutations';
import { HorseDocumentUpload } from './horse-document-upload';
import { LEGACY_COLOR, LegacySecTitle, legacyButtonGhostStyle, legacyCardStyle } from './legacy-theme';
import type { DocumentRequirement, HorseWithDocumentUrls } from '../types';

const fieldInputStyle: CSSProperties = {
  fontFamily: 'inherit',
  fontSize: 13,
  padding: '6px 10px',
  borderRadius: 8,
  border: `1px solid ${LEGACY_COLOR.border}`,
  width: '100%',
};

/**
 * The dashboard's Horse tab — legacy's `#dtab-horse` (rider.html): sec-title
 * "Horses" with the "➕ Add a Horse" affordance in the header row, one card
 * per horse. Distinct from `HorseManager` (used on the pre-purchase wizard's
 * Step 2, legacy's own separate `#signup-horses-card` screen with its own
 * "Your horses" copy) — the two legacy screens share the same underlying
 * horse-editing fields but not the same header treatment, so they're kept as
 * separate components rather than one reused across both, same reasoning as
 * this module's other Real-vs-wizard duplications (see riderCategoryToDivisionCode,
 * getCurrentRiderProfile's module-local twin).
 *
 * A horse's registered `name` is never editable here — no input for it
 * exists anywhere in this file, matching the DB trigger
 * (assert_horse_name_immutable) that would reject the write anyway.
 */
export function HorseTabView({
  horses,
  documentRequirements,
}: {
  horses: HorseWithDocumentUrls[];
  documentRequirements: DocumentRequirement[];
}) {
  const [adding, setAdding] = useState(false);
  const [newHorseName, setNewHorseName] = useState('');
  const createHorse = useCreateHorse({
    onSuccess: () => {
      setNewHorseName('');
      setAdding(false);
    },
  });

  return (
    <div style={legacyCardStyle}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 16,
          flexWrap: 'wrap',
          gap: 10,
        }}
      >
        <LegacySecTitle style={{ margin: 0 }}>Horses</LegacySecTitle>
        <button
          type="button"
          style={legacyButtonGhostStyle}
          onClick={() => {
            setAdding(true);
          }}
        >
          ➕ Add a Horse
        </button>
      </div>

      {horses.length === 0 && !adding && (
        <p style={{ fontSize: 13.5, color: LEGACY_COLOR.inkSoft }}>
          No horses on your account yet — add one above.
        </p>
      )}

      {horses.map((horse) => (
        <LegacyHorseCard key={horse.id} horse={horse} documentRequirements={documentRequirements} />
      ))}

      {adding && (
        <form
          style={{
            display: 'flex',
            alignItems: 'flex-end',
            gap: 8,
            background: LEGACY_COLOR.white,
            border: `1px solid ${LEGACY_COLOR.border}`,
            borderRadius: 10,
            padding: '13px 16px',
            marginBottom: 8,
          }}
          onSubmit={(event) => {
            event.preventDefault();
            if (!newHorseName.trim()) return;
            createHorse.mutate({ name: newHorseName.trim() });
          }}
        >
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', fontSize: 11, color: LEGACY_COLOR.inkSoft, marginBottom: 4 }}>
              Horse&apos;s registered name
            </label>
            <input
              autoFocus
              placeholder="e.g. Midnight Runner"
              value={newHorseName}
              style={fieldInputStyle}
              onChange={(event) => {
                setNewHorseName(event.target.value);
              }}
            />
            <p style={{ fontSize: 11.5, color: LEGACY_COLOR.inkSoft, margin: '4px 0 0' }}>
              This can&apos;t be changed once added.
            </p>
          </div>
          <button
            type="submit"
            style={{
              fontFamily: 'inherit',
              fontWeight: 600,
              cursor: 'pointer',
              borderRadius: 8,
              border: '1px solid transparent',
              fontSize: 14,
              padding: '10px 18px',
              background: LEGACY_COLOR.hunterDeep,
              color: '#fff',
            }}
            disabled={createHorse.isPending || !newHorseName.trim()}
          >
            {createHorse.isPending ? 'Adding…' : 'Add horse'}
          </button>
        </form>
      )}
    </div>
  );
}

function LegacyHorseCard({
  horse,
  documentRequirements,
}: {
  horse: HorseWithDocumentUrls;
  documentRequirements: DocumentRequirement[];
}) {
  const updateHorse = useUpdateHorse();
  const deleteHorse = useDeleteHorse();
  const uploadsByRequirement = new Map(horse.documentUploads.map((u) => [u.requirementId, u]));

  return (
    <div
      style={{
        background: LEGACY_COLOR.white,
        border: `1px solid ${LEGACY_COLOR.border}`,
        borderRadius: 10,
        padding: '13px 16px',
        marginBottom: 8,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <div style={{ fontWeight: 700, color: LEGACY_COLOR.ink }}>{horse.name}</div>
        <button
          type="button"
          style={{ ...legacyButtonGhostStyle, padding: '4px 10px', fontSize: 12 }}
          disabled={deleteHorse.isPending}
          onClick={() => {
            if (!confirm(`Remove ${horse.name} from your account? This can't be undone.`)) return;
            deleteHorse.mutate({ id: horse.id });
          }}
        >
          Remove horse
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 10 }}>
        <div>
          <label style={{ display: 'block', fontSize: 11, color: LEGACY_COLOR.inkSoft, marginBottom: 4 }}>
            Stable name
          </label>
          <input
            defaultValue={horse.stable ?? ''}
            style={fieldInputStyle}
            onBlur={(event) => {
              updateHorse.mutate({ id: horse.id, stable: event.target.value });
            }}
          />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: 11, color: LEGACY_COLOR.inkSoft, marginBottom: 4 }}>
            Trainer name
          </label>
          <input
            defaultValue={horse.trainer ?? ''}
            style={fieldInputStyle}
            onBlur={(event) => {
              updateHorse.mutate({ id: horse.id, trainer: event.target.value });
            }}
          />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: 11, color: LEGACY_COLOR.inkSoft, marginBottom: 4 }}>
            Trainer phone
          </label>
          <input
            type="tel"
            defaultValue={horse.trainer_phone ?? ''}
            style={fieldInputStyle}
            onBlur={(event) => {
              updateHorse.mutate({ id: horse.id, trainerPhone: event.target.value });
            }}
          />
        </div>
      </div>

      <label
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          fontSize: 13,
          color: LEGACY_COLOR.ink,
          marginTop: 10,
        }}
      >
        <input
          type="checkbox"
          defaultChecked={horse.is_stallion ?? false}
          onChange={(event) => {
            updateHorse.mutate({ id: horse.id, isStallion: event.target.checked });
          }}
        />
        Is your horse a stallion?
      </label>

      {documentRequirements.length > 0 && (
        <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {documentRequirements.map((req) => (
            <HorseDocumentUpload
              key={req.id}
              horseId={horse.id}
              requirement={req}
              existing={uploadsByRequirement.get(req.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

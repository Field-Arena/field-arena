'use client';

import { useState, type CSSProperties } from 'react';
import { useUpdateRiderProfile } from '@/modules/riders/hooks/use-rider-profile-mutations';
import {
  LEGACY_COLOR,
  LegacySecTitle,
  legacyBlockTitleStyle,
  legacyButtonGhostStyle,
  legacyCardStyle,
} from '@/modules/riders/ui/legacy-theme';
import type { RiderProfileUpdateInput } from '@/modules/riders/schemas';
import type { RiderRow } from '@/modules/riders/types';
import styles from './rider-dashboard.module.css';

type EditableField = keyof RiderProfileUpdateInput;

const rowStyle: CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 12,
  borderBottom: `1px solid ${LEGACY_COLOR.border}`,
  padding: '8px 0',
  fontSize: 13.5,
};

const inputStyle: CSSProperties = {
  fontFamily: 'inherit',
  fontSize: 13.5,
  padding: '6px 10px',
  borderRadius: 8,
  border: `1px solid ${LEGACY_COLOR.border}`,
  width: 190,
  maxWidth: '100%',
  minWidth: 0,
};

export function ProfileTab({ rider }: { rider: RiderRow }) {
  const name = [rider.first_name, rider.last_name].filter(Boolean).join(' ') || '—';
  const credentials = [rider.usef ? `USEF ${rider.usef}` : '', rider.fei ? `FEI ${rider.fei}` : '']
    .filter(Boolean)
    .join(' · ');

  return (
    <div style={legacyCardStyle}>
      <LegacySecTitle>Rider profile</LegacySecTitle>
      <div className={styles.profileGrid}>
        <div>
          <div style={legacyBlockTitleStyle}>Rider</div>
          <FixedRow label="Name" value={name} />
          <FixedRow label="Category" value={rider.category ?? '—'} />
          <FixedRow label="Date of birth" value={rider.dob ?? '—'} />
          {credentials && <FixedRow label="Credentials" value={credentials} />}
          <FixedRow label="Email" value={rider.email} />
          <EditableRow rider={rider} field="phone" label="Phone" type="tel" />
          <EditableRow rider={rider} field="street" label="Street" />
          <EditableRow rider={rider} field="city" label="City" />
        </div>
        <div>
          <div style={legacyBlockTitleStyle}>Emergency contact</div>
          <EditableRow rider={rider} field="ecFirstName" label="First name" />
          <EditableRow rider={rider} field="ecLastName" label="Last name" />
          <EditableRow rider={rider} field="ecRel" label="Relationship" />
          <EditableRow rider={rider} field="ecPhone" label="Phone" type="tel" />
        </div>
      </div>
    </div>
  );
}

function FixedRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={rowStyle}>
      <span style={{ color: LEGACY_COLOR.inkSoft }}>{label}</span>
      <span style={{ color: LEGACY_COLOR.ink }}>{value}</span>
    </div>
  );
}

const RIDER_ROW_VALUE: Record<EditableField, keyof RiderRow> = {
  phone: 'phone',
  street: 'street',
  city: 'city',
  state: 'state',
  zip: 'zip',
  usef: 'usef',
  fei: 'fei',
  category: 'category',
  dob: 'dob',
  ecFirstName: 'ec_first_name',
  ecLastName: 'ec_last_name',
  ecRel: 'ec_rel',
  ecPhone: 'ec_phone',
};

function EditableRow({
  rider,
  field,
  label,
  type = 'text',
}: {
  rider: RiderRow;
  field: EditableField;
  label: string;
  type?: 'text' | 'tel';
}) {
  const [editing, setEditing] = useState(false);
  const currentValue = rider[RIDER_ROW_VALUE[field]] ?? '';
  // Saved value wins over the (possibly still-stale) rider prop until
  // router.refresh() delivers fresh data — otherwise the display briefly
  // reverts to the old/blank value in the gap between the mutation
  // resolving and the refresh actually landing.
  const [savedValue, setSavedValue] = useState<string | null>(null);
  const updateProfile = useUpdateRiderProfile({
    onSuccess: () => {
      setEditing(false);
    },
  });
  const displayValue = savedValue ?? currentValue;

  if (!editing) {
    return (
      <div style={rowStyle}>
        <span style={{ color: LEGACY_COLOR.inkSoft }}>{label}</span>
        <div
          style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0, maxWidth: '100%' }}
        >
          <span style={{ color: LEGACY_COLOR.ink, minWidth: 0 }}>{displayValue || 'Not set'}</span>
          <button
            type="button"
            aria-label={`Edit ${label.toLowerCase()}`}
            style={{ ...legacyButtonGhostStyle, padding: '4px 10px', fontSize: 12 }}
            onClick={() => {
              setEditing(true);
            }}
          >
            Edit
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={rowStyle}>
      <span style={{ color: LEGACY_COLOR.inkSoft }}>{label}</span>
      <input
        autoFocus
        type={type}
        aria-label={label}
        defaultValue={displayValue}
        disabled={updateProfile.isPending}
        style={inputStyle}
        onBlur={(event) => {
          const value = event.target.value.trim();

          if (value === displayValue) {
            setEditing(false);
            return;
          }
          updateProfile.mutate(
            { [field]: value },
            {
              onSuccess: () => {
                setSavedValue(value);
              },
            },
          );
        }}
        onKeyDown={(event) => {
          if (event.key === 'Escape') setEditing(false);
        }}
      />
    </div>
  );
}

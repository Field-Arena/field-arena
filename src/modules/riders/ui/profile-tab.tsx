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
import { Button } from '@/shared/ui/shadcn/button';
import { Input } from '@/shared/ui/shadcn/input';

type EditableField = keyof RiderProfileUpdateInput;

const rowStyle: CSSProperties = {
  display: 'flex',
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
};

export function ProfileTab({ rider }: { rider: RiderRow }) {
  const name = [rider.first_name, rider.last_name].filter(Boolean).join(' ') || '—';
  const credentials = [rider.usef ? `USEF ${rider.usef}` : '', rider.fei ? `FEI ${rider.fei}` : '']
    .filter(Boolean)
    .join(' · ');

  return (
    <div style={legacyCardStyle}>
      <LegacySecTitle>Rider profile</LegacySecTitle>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginTop: 16 }}>
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
          <EditableRow rider={rider} field="state" label="State" />
          <EditableRow rider={rider} field="zip" label="Zip" />
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
  const updateProfile = useUpdateRiderProfile({
    onSuccess: () => {
      setEditing(false);
    },
  });

  if (!editing) {
    return (
      <div style={rowStyle}>
        <span style={{ color: LEGACY_COLOR.inkSoft }}>{label}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ color: LEGACY_COLOR.ink }}>{currentValue || 'Not set'}</span>
          <Button
            type="button"
            variant="ghost"
            style={{ ...legacyButtonGhostStyle, padding: '4px 10px', fontSize: 12 }}
            onClick={() => {
              setEditing(true);
            }}
          >
            Edit
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div style={rowStyle}>
      <span style={{ color: LEGACY_COLOR.inkSoft }}>{label}</span>
      <Input
        autoFocus
        type={type}
        defaultValue={currentValue}
        disabled={updateProfile.isPending}
        style={inputStyle}
        onBlur={(event) => {
          const value = event.target.value.trim();

          if (value === currentValue) {
            setEditing(false);
            return;
          }
          updateProfile.mutate({ [field]: value });
        }}
        onKeyDown={(event) => {
          if (event.key === 'Escape') setEditing(false);
        }}
      />
    </div>
  );
}

'use client';

import { useState } from 'react';
import { MEMBER_TYPES } from '@/modules/organizations/constants';
import type { MemberRow } from '@/modules/organizations/data/queries';
import {
  useCreateMember,
  useDeleteMember,
  useUpdateMember,
} from '@/modules/organizations/hooks/use-member-mutations';

function isBusiness(role: string): boolean {
  return role === 'Vendor';
}

export function useMemberEditForm({
  member,
  onClose,
}: {
  member: MemberRow | null;
  onClose: () => void;
}) {
  const [role, setRole] = useState(member?.role ?? 'Member');
  const [firstName, setFirstName] = useState(member?.firstName ?? '');
  const [lastName, setLastName] = useState(member?.lastName ?? '');
  const [businessName, setBusinessName] = useState(member?.name ?? '');
  const [email, setEmail] = useState(member?.email ?? '');
  const [phone, setPhone] = useState(member?.phone ?? '');
  const [status, setStatus] = useState(member?.membershipStatus ?? 'active');
  const [expires, setExpires] = useState(member?.membershipExpires ?? '');
  const [notes, setNotes] = useState(member?.notes ?? '');
  const [extra, setExtra] = useState<Record<string, string>>(member?.extraFields ?? {});
  const [nameError, setNameError] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const create = useCreateMember({ onSuccess: onClose });
  const update = useUpdateMember({ onSuccess: onClose });
  const remove = useDeleteMember({ onSuccess: onClose });
  const pending = create.isPending || update.isPending;

  function setExtraField(key: string, value: string) {
    setExtra((prev) => ({ ...prev, [key]: value }));
  }

  function submit() {
    const typed = isBusiness(role)
      ? businessName.trim()
      : [firstName.trim(), lastName.trim()].filter(Boolean).join(' ');

    const name = typed === '' ? (member?.name ?? '') : typed;
    if (!name) {
      setNameError(true);
      return;
    }
    setNameError(false);

    const values = {
      name,
      firstName: isBusiness(role) ? '' : firstName,
      lastName: isBusiness(role) ? '' : lastName,
      role: role as (typeof MEMBER_TYPES)[number],
      email,
      phone,
      membershipStatus: status as 'active' | 'inactive',
      membershipExpires: expires,
      notes,
      extraFields: extra,
    };

    if (member) update.mutate({ ...values, id: member.id });
    else create.mutate(values);
  }

  return {
    isBusiness: isBusiness(role),
    role,
    setRole,
    firstName,
    setFirstName,
    lastName,
    setLastName,
    businessName,
    setBusinessName,
    email,
    setEmail,
    phone,
    setPhone,
    status,
    setStatus,
    expires,
    setExpires,
    notes,
    setNotes,
    extra,
    setExtraField,
    nameError,
    confirmDelete,
    setConfirmDelete,
    pending,
    remove,
    submit,
  };
}

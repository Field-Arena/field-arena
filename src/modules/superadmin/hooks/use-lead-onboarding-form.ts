'use client';

import { useState } from 'react';
import type { LeadRow } from '@/modules/superadmin/types';
import type { ChecklistItem } from '@/modules/superadmin/schemas';
import { toChecklist } from '@/modules/superadmin/utils/to-checklist';
import {
  useUpdateLead,
  useSendLeadOnboarding,
} from '@/modules/superadmin/hooks/use-lead-mutations';

/** Owns the onboarding date, checklist state, and its schedule/save/send mutations. */
export function useLeadOnboardingForm(lead: LeadRow) {
  const [when, setWhen] = useState(lead.onboarding_at ? lead.onboarding_at.slice(0, 16) : '');
  const [checklist, setChecklist] = useState<ChecklistItem[]>(
    toChecklist(lead.onboarding_checklist),
  );
  const schedule = useUpdateLead({ successMessage: 'Onboarding scheduled' });
  const saveChecklist = useUpdateLead({ successMessage: 'Checklist updated' });
  const send = useSendLeadOnboarding();

  const done = checklist.filter((c) => c.done).length;

  function toggleItem(id: string) {
    setChecklist((prev) => prev.map((c) => (c.id === id ? { ...c, done: !c.done } : c)));
  }

  function saveSchedule() {
    schedule.mutate({ id: lead.id, onboardingAt: when ? when : null });
  }

  function persistChecklist() {
    saveChecklist.mutate({ id: lead.id, onboardingChecklist: checklist });
  }

  function sendOnboardingEmail() {
    send.mutate(lead.id);
  }

  return {
    when,
    setWhen,
    checklist,
    done,
    toggleItem,
    schedule,
    saveSchedule,
    saveChecklist,
    persistChecklist,
    send,
    sendOnboardingEmail,
  };
}

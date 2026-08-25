'use client';

import { useState } from 'react';
import { LEAD_STATUSES } from '@/modules/superadmin/constants';
import type { LeadRow } from '@/modules/superadmin/types';
import { useUpdateLead } from '@/modules/superadmin/hooks/use-lead-mutations';

/** Owns the lead contact-and-account editing form state and its save payload. */
export function useLeadContactForm(lead: LeadRow) {
  const [orgName, setOrgName] = useState(lead.org_name);
  const [contactName, setContactName] = useState(lead.contact_name ?? '');
  const [email, setEmail] = useState(lead.email ?? '');
  const [phone, setPhone] = useState(lead.phone ?? '');
  const [website, setWebsite] = useState(lead.website ?? '');
  const [shows, setShows] = useState(
    lead.shows_per_year != null ? String(lead.shows_per_year) : '',
  );
  const [status, setStatus] = useState(lead.status ?? 'new');
  const update = useUpdateLead({ successMessage: 'Contact saved' });

  function save() {
    update.mutate({
      id: lead.id,
      orgName,
      contactName,
      email,
      phone,
      website,
      status: status as (typeof LEAD_STATUSES)[number]['value'],
      showsPerYear: shows.trim() ? Math.max(0, Math.floor(Number(shows) || 0)) : null,
    });
  }

  return {
    orgName,
    setOrgName,
    contactName,
    setContactName,
    email,
    setEmail,
    phone,
    setPhone,
    website,
    setWebsite,
    shows,
    setShows,
    status,
    setStatus,
    update,
    save,
  };
}

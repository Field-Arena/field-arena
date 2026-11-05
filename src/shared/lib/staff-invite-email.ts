import 'server-only';
import { renderEmail } from '@/shared/lib/email-layout';

/* The "you've been added to a show" notice for someone who already has an
 * account (new people get Supabase's invite email instead —
 * supabase/templates/invite.html). Shared because both the show-level staff
 * screen and the Super Admin org-staff screen send it. */
export function buildStaffInviteEmail(params: {
  name: string;
  role: string;
  showName: string;
  loginUrl: string;
}): { subject: string; html: string; text: string } {
  const firstWord = params.name.trim().split(/\s+/)[0] ?? '';
  const firstName = firstWord !== '' ? firstWord : params.name;
  const { html, text } = renderEmail({
    preheader: `You're on the team for ${params.showName} as ${params.role}.`,
    eyebrow: 'Show team',
    heading: `You've been added as ${params.role}`,
    greeting: `Hi ${firstName},`,
    paragraphs: [
      [
        "You've been added as ",
        { strong: params.role },
        ' for ',
        { strong: params.showName },
        '. Log in to see your assignments and get set up.',
      ],
    ],
    details: [
      { label: 'Show', value: params.showName },
      { label: 'Role', value: params.role },
    ],
    link: { label: 'Log in using this link:', url: params.loginUrl },
    footerNote: `you were added to the team for ${params.showName} on Field & Arena.`,
  });
  return {
    subject: `You've been added as ${params.role} for ${params.showName}`,
    html,
    text,
  };
}

import { SIGNABLE_DOCUMENT_KEYWORDS, UPLOAD_DOCUMENT_KEYWORDS } from '@/modules/riders/constants';
import type { DocumentRequirement } from '@/modules/riders/types';

/** True when a required document is an agreement the rider signs on the site
 * (typed name + "I agree"), false when it is a file they upload (Coggins,
 * vaccination record, membership card…). An explicit organizer `kind` always
 * wins; otherwise a requirement with an expiration date is a certificate, and
 * the label decides the rest — certificate words beat agreement words. */
export function isSignableRequirement(requirement: DocumentRequirement): boolean {
  if (requirement.kind === 'sign') return true;
  if (requirement.kind === 'upload') return false;
  if (requirement.requiresExpiration) return false;
  if (UPLOAD_DOCUMENT_KEYWORDS.test(requirement.label)) return false;
  return SIGNABLE_DOCUMENT_KEYWORDS.test(requirement.label);
}

/** The wording a rider agrees to when signing a requirement on the site. The
 * organizer's own text when they wrote one, otherwise a plain acknowledgment
 * naming the document. */
export function signableRequirementText(
  requirement: DocumentRequirement,
  showName?: string | null,
): string {
  const own = requirement.text?.trim();
  if (own) return own;
  const show = showName?.trim() ? ` for ${showName.trim()}` : '';
  return `I have read, understand and agree to the ${requirement.label}${show}. I confirm that the information I have given is accurate, and I understand that typing my name below is my electronic signature and has the same effect as signing on paper.`;
}

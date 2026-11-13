/* A demo request may come from someone with no barn or organization. Leads are
 * keyed by organization name, so those people are filed under their own name. */
export function leadOrgName(organization: string | undefined, contactName: string): string {
  const org = (organization ?? '').trim();
  return org === '' ? `${contactName.trim()} (independent)` : org;
}

/* Escapes % and _ so a name is matched literally by ilike. */
export function escapeLikePattern(value: string): string {
  return value.replace(/[\\%_]/g, (char) => `\\${char}`);
}

/* What gets added to an existing lead when the same organization asks again,
 * so a second request is never lost. */
export function repeatRequestNote(request: {
  receivedOn: string;
  contactName: string;
  email: string;
  details: string;
}): string {
  return `\n\n— Another request on ${request.receivedOn} from ${request.contactName} <${request.email}>\n${request.details}`;
}

/* The waiver template ships with {{SHOW_NAME}}, {{SHOW_DATES}} and
 * {{ORGANIZER_NAME}} tokens, and the organizer-side editor tells organizers
 * outright that they are "filled in automatically" (waiver-card.tsx). Nothing
 * was filling them in, so a rider signed a release of liability that never
 * named the event, the dates, or the organizer — the literal token text
 * appeared in the paragraph they typed their legal name under.
 *
 * Legacy did this at rider.html:1944 with String.replace(), which substitutes
 * only the FIRST occurrence. {{ORGANIZER_NAME}} appears TWICE in the very
 * first paragraph of the default template, so legacy left the second one
 * showing too. replaceAll is the fix legacy should have had; reproducing the
 * bug for the sake of parity would be the wrong call on a legal document.
 *
 * Substitution is presentation-only: the stored waiver_text keeps its tokens
 * so the organizer can still edit the template, and waiver_signatures records
 * who signed and when, not a text snapshot. */
export function fillWaiverPlaceholders(
  waiverText: string,
  values: {
    showName: string;
    dateLabel: string | null;
    startDate: string | null;
    endDate: string | null;
    orgName: string | null;
  },
): string {
  /* Legacy's own date rule: the organizer's own label when they wrote one,
   * otherwise the start/end pair joined with an en dash (rider.html:1939). */
  const dates =
    values.dateLabel?.trim() ??
    [values.startDate, values.endDate].filter(Boolean).join(' – ');

  const orgName = values.orgName?.trim() ?? '';

  return waiverText
    .replaceAll('{{SHOW_NAME}}', values.showName)
    .replaceAll('{{SHOW_DATES}}', dates || 'the dates announced by the organizer')
    .replaceAll('{{ORGANIZER_NAME}}', orgName || 'the show organizer');
}

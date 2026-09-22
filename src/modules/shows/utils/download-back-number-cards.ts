/* Pure client-side helper: POSTs the selected show_entry ids to the
 * back-number-cards route and triggers a browser download of the
 * resulting PDF. Read-only on the server side — reprinting never touches
 * the assigned number. */
export async function downloadBackNumberCards(
  showId: string,
  showEntryIds: string[],
  dims?: { cardWidthIn?: number; cardHeightIn?: number },
): Promise<void> {
  const response = await fetch(`/api/shows/${showId}/back-number-cards`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ showEntryIds, ...dims }),
  });
  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error ?? 'Could not generate the back number cards.');
  }
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `back-numbers-${showId}.pdf`;
  a.click();
  URL.revokeObjectURL(url);
}

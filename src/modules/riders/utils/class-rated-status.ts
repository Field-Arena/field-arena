/* "Rated" = an official / qualifying ride (classes.qualifying — the organizer's
 * per-class "Qualifying ride" toggle, legacy showbuilder/showstaff
 * `qualifying`). "Not rated" = a schooling ride. The same level can exist
 * twice in one show, once each way, at different prices.
 *
 * When the organizer never flagged any class in the show, the per-class flag
 * carries no information, so the show's own type decides (shows.show_type:
 * 'rated' vs 'schooling') — otherwise every class of a rated show would read
 * "Not rated". */
export function isClassRated(
  cls: { qualifying: boolean | null },
  context: { showType: string | null; anyClassFlagged: boolean },
): boolean {
  if (context.anyClassFlagged) return cls.qualifying === true;
  return context.showType === 'rated';
}

export function anyClassFlaggedQualifying(classes: { qualifying: boolean | null }[]): boolean {
  return classes.some((cls) => cls.qualifying === true);
}

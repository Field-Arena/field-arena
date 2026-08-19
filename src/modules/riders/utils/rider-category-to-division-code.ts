export type ClassEntryDivisionCode = 'J' | 'Y' | 'A' | 'O';

/**
 * Maps a rider's chosen RIDER_CATEGORIES value to the class_entries.division
 * code the awards/placings system understands — see that column's own CHECK
 * constraint and comment in 20260804120000_awards_placings.sql.
 *
 * No legacy source defines this mapping: the awards feature's own seed data
 * assigns divisions randomly (showstaff.html's demo generator), and the real
 * rider signup category (rider.html's "Rider class category" select) was
 * never wired to it before this port — checkout is the first place a real
 * category and a real class_entries row exist at the same time. This is a
 * first, reasonable mapping, not a ported behavior, and worth a second look
 * from someone who knows how shows actually classify these for awards.
 * 'Under 25 (U25)' rides with 'Y' (Young Rider) — most governing bodies treat
 * U25 as the Young Rider division extended to age 25, not as Open. 'Senior'
 * doesn't map cleanly to any of the four codes, so it falls to 'O' — the same
 * "unknown defaults to Open" rule the column's own comment states.
 */
export function riderCategoryToDivisionCode(category: string | null): ClassEntryDivisionCode {
  switch (category) {
    case 'Junior':
    case 'Children':
      return 'J';
    case 'Young Rider':
    case 'Under 25 (U25)':
      return 'Y';
    case 'Adult Amateur':
      return 'A';
    default:
      return 'O';
  }
}

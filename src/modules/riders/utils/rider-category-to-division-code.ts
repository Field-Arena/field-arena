export type ClassEntryDivisionCode = 'J' | 'Y' | 'A' | 'O';

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

/* 0-based positions of the USEF template columns Field & Arena fills in.
 * Everything else in the 142-column template stays blank (jumping, eventing,
 * driving, reining, vaulting and breed-specific columns). */
export const COL = {
  compYear: 0,
  compId: 1,
  classNumber: 2,
  classTitle: 3,
  sectionCode: 4,
  numEntries: 9,
  qualifier: 12,
  placing: 13,
  exhibitorNumber: 14,
  horseUsef: 15,
  horsePassport: 16,
  horseName: 17,
  horseRegistration: 18,
  horseFei: 19,
  horseYearOfBirth: 20,
  horseBreed: 21,
  riderUsef: 22,
  riderNoUsefWhy: 23,
  riderName: 24,
  riderStreet: 25,
  riderCity: 26,
  riderState: 27,
  riderZip: 28,
  riderDisciplineNumber: 30,
  ownerUsef: 31,
  ownerNoUsefWhy: 32,
  ownerName: 33,
  ownerStreet: 34,
  ownerCity: 35,
  ownerState: 36,
  ownerZip: 37,
  trainerUsef: 40,
  trainerName: 42,
  trainerStreet: 43,
  trainerCity: 44,
  trainerState: 45,
  trainerZip: 46,
  dressageTotalScore: 72,
  dressageTotalPercentage: 73,
  dressageLevel: 74,
  dressageRiderStatus: 75,
  riderEmail: 113,
  ownerEmail: 114,
  numberCompeted: 115,
  numberCompleted: 116,
} as const;

export const MAX_JUDGES = 7;

/* Judges 1-6 sit together (first, last, percentage, score); judge 7 was added
 * later at the far end of the template, with USEF IDs in their own block. */
export function judgeColumns(index: number): {
  first: number;
  last: number;
  pct: number;
  score: number;
  usefId: number;
} {
  if (index < 0 || index >= MAX_JUDGES)
    throw new RangeError(`Judge ${String(index + 1)} is out of range.`);
  if (index < 6) {
    const base = 48 + index * 4;
    return { first: base, last: base + 1, pct: base + 2, score: base + 3, usefId: 119 + index };
  }
  return { first: 126, last: 127, pct: 128, score: 129, usefId: 125 };
}

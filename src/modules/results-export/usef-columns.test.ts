import { test } from 'node:test';
import assert from 'node:assert/strict';
import { USEF_COLUMNS, USEF_COLUMN_COUNT } from './usef-columns';
import { COL, judgeColumns } from './columns';

test('the template has 142 columns', () => {
  assert.equal(USEF_COLUMN_COUNT, 142);
});

/* Guards the hand-written positions in COL against the real template headers:
 * if a column ever moves, this fails instead of exporting data under the wrong
 * heading. */
const EXPECTED_HEADER: Record<keyof typeof COL, RegExp> = {
  compYear: /^COMP YEAR$/,
  compId: /^USEF Comp ID number$/,
  classNumber: /^Class Number$/,
  classTitle: /^Class Title$/,
  sectionCode: /^USEF Section Code$/,
  numEntries: /^Number of entries$/,
  qualifier: /^Qualifier/,
  placing: /^Placing$/,
  exhibitorNumber: /^Exhibitor Number$/,
  horseUsef: /^Horse USEF Number$/,
  horsePassport: /^Horse Passport Number$/,
  horseName: /^Horse Name$/,
  horseRegistration: /^Horse Registration\/Breed Affiliate Number$/,
  horseFei: /^Horse FEI Number/,
  horseYearOfBirth: /^Horse Year of Birth$/,
  horseBreed: /^Horse Breed$/,
  riderUsef: /^Rider USEF Number$/,
  riderNoUsefWhy: /^If No USEF Number, WHY\?$/,
  riderName: /^Rider Name$/,
  riderStreet: /^Rider Street Address$/,
  riderCity: /^Rider City$/,
  riderState: /^Rider State$/,
  riderZip: /^Rider Zip$/,
  riderDisciplineNumber: /^Rider Discipline Number/,
  ownerUsef: /^Owner USEF Number$/,
  ownerNoUsefWhy: /^If No USEF Number, WHY\?$/,
  ownerName: /^Owner Name$/,
  ownerStreet: /^Owner Street Address$/,
  ownerCity: /^Owner City$/,
  ownerState: /^Owner State$/,
  ownerZip: /^Owner Zip$/,
  trainerUsef: /^Trainer USEF Number$/,
  trainerName: /^Trainer Name$/,
  trainerStreet: /^Trainer Address$/,
  trainerCity: /^Trainer City$/,
  trainerState: /^Trainer State$/,
  trainerZip: /^Trainer Zip$/,
  dressageTotalScore: /^Dressage Score \(Total\)$/,
  dressageTotalPercentage: /^Dressage Percentage \(Total\)$/,
  dressageLevel: /^Dressage Level$/,
  dressageRiderStatus: /^Dressage Rider Status$/,
  riderEmail: /^Riders Email Address$/,
  ownerEmail: /^Owner Email Address$/,
  numberCompeted: /^Number that Competed$/,
  numberCompleted: /^Number that Completed$/,
};

for (const [key, pattern] of Object.entries(EXPECTED_HEADER)) {
  test(`column ${key} lines up with its USEF header`, () => {
    const index = COL[key as keyof typeof COL];
    assert.match(USEF_COLUMNS[index]?.header ?? '', pattern);
  });
}

test('judge columns line up for judges 1 to 7', () => {
  for (let i = 0; i < 7; i++) {
    const n = i + 1;
    const c = judgeColumns(i);
    assert.match(
      USEF_COLUMNS[c.first]?.header ?? '',
      new RegExp(`^Judge ?${String(n)} First Name$`),
    );
    assert.match(USEF_COLUMNS[c.last]?.header ?? '', new RegExp(`^Judge ?${String(n)} Last Name$`));
    assert.match(USEF_COLUMNS[c.pct]?.header ?? '', new RegExp(`^Judge ?${String(n)} Percentage$`));
    assert.match(USEF_COLUMNS[c.score]?.header ?? '', new RegExp(`^Judge ?${String(n)} Score`));
    assert.match(USEF_COLUMNS[c.usefId]?.header ?? '', new RegExp(`^Judge ?${String(n)} USEF ID$`));
  }
});

test('judge 8 does not exist', () => {
  assert.throws(() => judgeColumns(7), RangeError);
});

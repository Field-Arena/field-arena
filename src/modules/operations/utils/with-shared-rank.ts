export function withSharedRank<T extends { finalPctNum: number | null }>(
  rows: T[],
): (T & { place: number })[] {
  let rank = 1;
  let prev: number | null = null;
  return rows.map((row, i) => {
    if (i > 0 && prev !== row.finalPctNum) rank = i + 1;
    prev = row.finalPctNum;
    return { ...row, place: rank };
  });
}

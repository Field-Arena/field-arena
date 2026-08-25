let stallSeq = 0;

export function newStallId(): string {
  stallSeq += 1;
  return `vst${String(Date.now())}${String(stallSeq)}`;
}

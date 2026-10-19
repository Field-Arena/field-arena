/* ilike/like treat % and _ as wildcards (and \ as their escape). Any
 * user-supplied value matched with ilike must go through this so it matches
 * literally — "jane_doe@x.com" must not also match "janeXdoe@x.com". */
export function escapeLikePattern(value: string): string {
  return value.replace(/[\\%_]/g, (c) => `\\${c}`);
}

/* PostgREST `or()` / `and()` filters are a mini-language: `,` separates
 * conditions and `.`, `:`, `(`, `)` are syntax. A raw value spliced in — an
 * email like `a@x.com,role.eq.Show Admin` — rewrites the filter. Wrapping it
 * in double quotes makes PostgREST read it as one literal; inside the quotes
 * only `"` and `\` need a backslash. Use for every non-uuid value that ends up
 * inside an `.or()` string. */
export function quoteFilterValue(value: string): string {
  return `"${value.replace(/["\\]/g, (c) => `\\${c}`)}"`;
}

/** `user_id = <id> OR email = <email>` — how a staff seat is matched to the
 * signed-in user. RLS still decides which rows are visible (an email only
 * matches once confirmed, 20261019120000). */
export function staffIdentityFilter(profile: { id: string; email: string }): string {
  return `user_id.eq.${quoteFilterValue(profile.id)},email.eq.${quoteFilterValue(profile.email)}`;
}

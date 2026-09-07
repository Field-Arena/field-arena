/* Strips the extension, any 4-digit year, and every non-alphanumeric
 * character, then lowercases — so "Intermediate A-B Freestyle 2022.pdf" and
 * the catalog title "Intermediate A-B Freestyle" both normalize to
 * "intermediateabfreestyle".
 *
 * The year regex uses digit lookaround, NOT \b: \b treats underscore as a word
 * character, so "2023_DSE_Score_Sheet" (an internal source-file stub) never
 * had its year stripped while "2023 DSE Score Sheet.pdf" (a real
 * space-separated filename) did — silently breaking exactly the
 * underscore-joined stubs this is meant to catch. The lookaround also stops a
 * year-like run inside a longer number ("12023456") from being mangled. */
export function normalizeFilename(s: string): string {
  return s
    .replace(/\.[^.]+$/, '')
    .replace(/(?<!\d)(19|20)\d{2}(?!\d)/g, '')
    .replace(/[^a-z0-9]/gi, '')
    .toLowerCase();
}

// mammoth ships no types and no @types/mammoth package exists — this covers
// only the one function this codebase actually calls.
declare module 'mammoth' {
  interface ExtractRawTextResult {
    value: string;
    messages: unknown[];
  }

  export function extractRawText(input: { buffer: Buffer }): Promise<ExtractRawTextResult>;
}

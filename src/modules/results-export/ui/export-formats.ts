import type { ExportFormat } from '../types';

export interface ExportFormatOption {
  format: ExportFormat;
  label: string;
  blurb: string;
  /** Shown as a small tag next to the label. */
  tag?: string;
}

export const EXPORT_FORMAT_OPTIONS: readonly ExportFormatOption[] = [
  {
    format: 'xlsx',
    label: 'Excel (.xlsx)',
    blurb: 'One sheet, bold frozen header — opens straight in Excel',
  },
  {
    format: 'csv',
    label: 'CSV (.csv)',
    blurb: 'Plain text, UTF-8 — for any spreadsheet or upload',
  },
  {
    format: 'dat',
    label: 'USEF .dat',
    blurb: "Pipe-delimited stand-in until USEF's file spec is added",
    tag: 'layout pending',
  },
];

export function exportHref(showRef: string, format: ExportFormat): string {
  return `/api/shows/${encodeURIComponent(showRef)}/results-export?format=${format}`;
}

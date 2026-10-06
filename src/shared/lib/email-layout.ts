import 'server-only';

/* The one layout every app-sent email (Resend, via sendEmail) is rendered
 * through, so a staff invite, an order receipt and a document reminder all
 * read as the same product as the dashboard.
 *
 * supabase/templates/*.html (the auth emails Supabase renders itself) can't
 * import this file — they repeat the same markup by hand. Change one, change
 * the other, or the two families of email drift apart.
 *
 * Email-client rules this follows: table layout and inline styles only (clients
 * strip <style> blocks and implement neither flex nor grid), no images, and
 * the action link is shown as its full URL rather than hidden behind a button
 * — people can see where it goes and copy it when a click doesn't work.
 *
 * Every string a caller passes is treated as plain text and escaped here, so
 * callers never build HTML themselves. */

const COLOR = {
  brand: '#146a47',
  brandInk: '#0c4a31',
  brandTint: '#eaf5ef',
  brandLine: '#cfe5d8',
  ink: '#101828',
  ink2: '#475467',
  ink3: '#8a94a3',
  line: '#e7eaee',
  page: '#f5f7f8',
  white: '#ffffff',
} as const;

const SERIF = "Georgia,'Times New Roman',serif";
const SANS = "-apple-system,'Segoe UI',Inter,Helvetica,Arial,sans-serif";

/** Plain text, or plain text with some runs set in bold. */
export type EmailText = string | readonly (string | { strong: string })[];

export interface EmailDetail {
  label: string;
  value: string;
}

export interface EmailLineItem {
  label: string;
  qty?: number;
  amount: string;
}

export interface EmailContent {
  /** Inbox preview line; hidden in the body. */
  preheader: string;
  /** Small uppercase label above the heading. */
  eyebrow?: string;
  heading: string;
  /** "Hi Sam," — rendered as the first paragraph. */
  greeting?: string;
  paragraphs?: readonly EmailText[];
  /** Two-column label / value summary (show, role, rider number…). */
  details?: readonly EmailDetail[];
  /** A titled bullet list (missing documents, onboarding checklist…). */
  list?: { title?: string; items: readonly string[] };
  /** Receipt-style table with a total row. */
  lineItems?: { items: readonly EmailLineItem[]; totalLabel: string; total: string };
  /** One-time code, shown large. */
  code?: string;
  /** The action — shown as its full, clickable URL. */
  link?: { label: string; url: string };
  /** Paragraphs after the link / code (expiry notes, sign-off). */
  closing?: readonly EmailText[];
  /** Completes "You received this email because …". */
  footerNote: string;
}

export interface RenderedEmail {
  html: string;
  text: string;
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function richHtml(text: EmailText): string {
  if (typeof text === 'string') return escapeHtml(text);
  return text
    .map((part) =>
      typeof part === 'string'
        ? escapeHtml(part)
        : `<strong style="color:${COLOR.ink};font-weight:600;">${escapeHtml(part.strong)}</strong>`,
    )
    .join('');
}

function richText(text: EmailText): string {
  if (typeof text === 'string') return text;
  return text.map((part) => (typeof part === 'string' ? part : part.strong)).join('');
}

function paragraph(text: EmailText, last = false): string {
  return (
    `<p style="margin:0 0 ${last ? '0' : '14px'};font-family:${SANS};font-size:15px;` +
    `line-height:1.6;color:${COLOR.ink2};">${richHtml(text)}</p>`
  );
}

function section(inner: string, padding = '0 32px 24px'): string {
  return `<tr><td style="padding:${padding};">${inner}</td></tr>`;
}

function detailsHtml(details: readonly EmailDetail[]): string {
  const rows = details
    .map(
      (d, i) =>
        `<tr>` +
        `<td valign="top" style="padding:10px 16px;${i > 0 ? `border-top:1px solid ${COLOR.line};` : ''}` +
        `font-family:${SANS};font-size:13px;line-height:1.5;color:${COLOR.ink3};width:38%;">` +
        `${escapeHtml(d.label)}</td>` +
        `<td valign="top" style="padding:10px 16px;${i > 0 ? `border-top:1px solid ${COLOR.line};` : ''}` +
        `font-family:${SANS};font-size:14px;line-height:1.5;color:${COLOR.ink};font-weight:600;">` +
        `${escapeHtml(d.value)}</td>` +
        `</tr>`,
    )
    .join('');
  return (
    `<table width="100%" cellpadding="0" cellspacing="0" role="presentation" ` +
    `style="border:1px solid ${COLOR.line};border-radius:10px;border-collapse:separate;">${rows}</table>`
  );
}

function listHtml(list: NonNullable<EmailContent['list']>): string {
  const title = list.title
    ? `<p style="margin:0 0 8px;font-family:${SANS};font-size:13px;font-weight:600;` +
      `color:${COLOR.ink};">${escapeHtml(list.title)}</p>`
    : '';
  const items = list.items
    .map(
      (item) =>
        `<tr>` +
        `<td valign="top" style="padding:4px 10px 4px 0;font-family:${SANS};font-size:15px;` +
        `line-height:1.5;color:${COLOR.brand};width:12px;">&#8226;</td>` +
        `<td valign="top" style="padding:4px 0;font-family:${SANS};font-size:15px;line-height:1.5;` +
        `color:${COLOR.ink};">${escapeHtml(item)}</td>` +
        `</tr>`,
    )
    .join('');
  return (
    title +
    `<table width="100%" cellpadding="0" cellspacing="0" role="presentation">${items}</table>`
  );
}

function lineItemsHtml(block: NonNullable<EmailContent['lineItems']>): string {
  const cell = `font-family:${SANS};font-size:14px;line-height:1.5;`;
  const rows = block.items
    .map(
      (item) =>
        `<tr>` +
        `<td valign="top" style="padding:10px 16px;border-top:1px solid ${COLOR.line};${cell}color:${COLOR.ink};">` +
        escapeHtml(item.label) +
        (item.qty && item.qty > 1
          ? `<span style="color:${COLOR.ink3};"> &times; ${String(item.qty)}</span>`
          : '') +
        `</td>` +
        `<td valign="top" align="right" style="padding:10px 16px;border-top:1px solid ${COLOR.line};` +
        `${cell}color:${COLOR.ink};white-space:nowrap;">${escapeHtml(item.amount)}</td>` +
        `</tr>`,
    )
    .join('');
  return (
    `<table width="100%" cellpadding="0" cellspacing="0" role="presentation" ` +
    `style="border:1px solid ${COLOR.line};border-radius:10px;border-collapse:separate;">` +
    `<tr>` +
    `<td style="padding:10px 16px;font-family:${SANS};font-size:11px;font-weight:600;letter-spacing:1px;` +
    `text-transform:uppercase;color:${COLOR.ink3};">Item</td>` +
    `<td align="right" style="padding:10px 16px;font-family:${SANS};font-size:11px;font-weight:600;` +
    `letter-spacing:1px;text-transform:uppercase;color:${COLOR.ink3};">Amount</td>` +
    `</tr>` +
    rows +
    `<tr>` +
    `<td style="padding:12px 16px;border-top:1px solid ${COLOR.line};background:${COLOR.brandTint};` +
    `border-radius:0 0 0 10px;${cell}font-weight:600;color:${COLOR.brandInk};">` +
    `${escapeHtml(block.totalLabel)}</td>` +
    `<td align="right" style="padding:12px 16px;border-top:1px solid ${COLOR.line};` +
    `background:${COLOR.brandTint};border-radius:0 0 10px 0;${cell}font-size:15px;font-weight:700;` +
    `color:${COLOR.brandInk};white-space:nowrap;">${escapeHtml(block.total)}</td>` +
    `</tr>` +
    `</table>`
  );
}

function codeHtml(code: string): string {
  return (
    `<table width="100%" cellpadding="0" cellspacing="0" role="presentation" ` +
    `style="background:${COLOR.brandTint};border:1px solid ${COLOR.brandLine};border-radius:10px;">` +
    `<tr><td align="center" style="padding:22px 16px;font-family:${SERIF};font-size:34px;` +
    `font-weight:600;letter-spacing:10px;color:${COLOR.brandInk};">${escapeHtml(code)}</td></tr>` +
    `</table>`
  );
}

function linkHtml(link: NonNullable<EmailContent['link']>): string {
  const url = escapeHtml(link.url);
  return (
    `<table width="100%" cellpadding="0" cellspacing="0" role="presentation" ` +
    `style="background:${COLOR.brandTint};border:1px solid ${COLOR.brandLine};border-radius:10px;">` +
    `<tr><td style="padding:16px 18px;">` +
    `<p style="margin:0 0 6px;font-family:${SANS};font-size:13px;line-height:1.5;color:${COLOR.ink2};">` +
    `${escapeHtml(link.label)}</p>` +
    `<a href="${url}" style="font-family:${SANS};font-size:14px;line-height:1.5;color:${COLOR.brand};` +
    `font-weight:600;text-decoration:underline;word-break:break-all;overflow-wrap:anywhere;">${url}</a>` +
    `</td></tr>` +
    `</table>`
  );
}

function renderHtml(c: EmailContent): string {
  const blocks: string[] = [];

  const intro: EmailText[] = [...(c.greeting ? [c.greeting] : []), ...(c.paragraphs ?? [])];
  blocks.push(
    section(
      (c.eyebrow
        ? `<p style="margin:0 0 10px;font-family:${SANS};font-size:11px;font-weight:600;` +
          `letter-spacing:1.4px;text-transform:uppercase;color:${COLOR.brand};">${escapeHtml(c.eyebrow)}</p>`
        : '') +
        `<h1 style="margin:0 0 ${intro.length ? '16px' : '0'};font-family:${SERIF};font-size:26px;` +
        `line-height:1.25;font-weight:600;color:${COLOR.ink};">${escapeHtml(c.heading)}</h1>` +
        intro.map((p, i) => paragraph(p, i === intro.length - 1)).join(''),
      '32px 32px 24px',
    ),
  );

  if (c.details?.length) blocks.push(section(detailsHtml(c.details)));
  if (c.list?.items.length) blocks.push(section(listHtml(c.list)));
  if (c.lineItems) blocks.push(section(lineItemsHtml(c.lineItems)));
  if (c.code) blocks.push(section(codeHtml(c.code)));
  if (c.link) blocks.push(section(linkHtml(c.link)));
  if (c.closing?.length) {
    blocks.push(
      section(c.closing.map((p, i) => paragraph(p, i === (c.closing?.length ?? 0) - 1)).join('')),
    );
  }

  return (
    `<!doctype html>` +
    `<html lang="en"><head>` +
    `<meta charset="utf-8">` +
    `<meta name="viewport" content="width=device-width, initial-scale=1">` +
    `<meta name="x-apple-disable-message-reformatting">` +
    `<title>${escapeHtml(c.heading)}</title>` +
    `</head>` +
    `<body style="margin:0;padding:0;background:${COLOR.page};">` +
    `<span style="display:none;max-height:0;max-width:0;overflow:hidden;opacity:0;mso-hide:all;` +
    `font-size:1px;line-height:1px;color:${COLOR.page};">${escapeHtml(c.preheader)}</span>` +
    `<table width="100%" cellpadding="0" cellspacing="0" role="presentation" ` +
    `style="background:${COLOR.page};margin:0;padding:32px 12px;">` +
    `<tr><td align="center">` +
    `<table width="560" cellpadding="0" cellspacing="0" role="presentation" ` +
    `style="width:100%;max-width:560px;background:${COLOR.white};border:1px solid ${COLOR.line};` +
    `border-radius:14px;overflow:hidden;">` +
    `<tr><td style="background:${COLOR.brandInk};padding:20px 32px;">` +
    `<span style="font-family:${SERIF};font-size:19px;font-weight:600;letter-spacing:.2px;` +
    `color:${COLOR.white};">Field &amp; Arena</span>` +
    `</td></tr>` +
    blocks.join('') +
    `<tr><td style="padding:0 32px 8px;"></td></tr>` +
    `</table>` +
    `<table width="560" cellpadding="0" cellspacing="0" role="presentation" ` +
    `style="width:100%;max-width:560px;">` +
    `<tr><td style="padding:20px 32px 0;font-family:${SANS};font-size:12px;line-height:1.6;` +
    `color:${COLOR.ink3};">` +
    `<p style="margin:0 0 4px;font-weight:600;">Field &amp; Arena &middot; Equestrian show management</p>` +
    `<p style="margin:0;">You received this email because ${escapeHtml(c.footerNote)}</p>` +
    `</td></tr>` +
    `</table>` +
    `</td></tr>` +
    `</table>` +
    `</body></html>`
  );
}

function renderText(c: EmailContent): string {
  const out: string[] = [c.heading, ''];
  if (c.greeting) out.push(c.greeting, '');
  for (const p of c.paragraphs ?? []) out.push(richText(p), '');
  if (c.details?.length) {
    for (const d of c.details) out.push(`${d.label}: ${d.value}`);
    out.push('');
  }
  if (c.list?.items.length) {
    if (c.list.title) out.push(c.list.title);
    for (const item of c.list.items) out.push(`- ${item}`);
    out.push('');
  }
  if (c.lineItems) {
    for (const item of c.lineItems.items) {
      out.push(
        `${item.label}${item.qty && item.qty > 1 ? ` x ${String(item.qty)}` : ''}  ${item.amount}`,
      );
    }
    out.push(`${c.lineItems.totalLabel}: ${c.lineItems.total}`, '');
  }
  if (c.code) out.push(c.code, '');
  if (c.link) out.push(c.link.label, c.link.url, '');
  for (const p of c.closing ?? []) out.push(richText(p), '');
  out.push('--', 'Field & Arena · Equestrian show management');
  out.push(`You received this email because ${c.footerNote}`);
  return out.join('\n');
}

export function renderEmail(content: EmailContent): RenderedEmail {
  return { html: renderHtml(content), text: renderText(content) };
}

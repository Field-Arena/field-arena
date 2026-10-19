import { formatTimestamp } from '@/shared/lib/format/date';
import type { IndependentTestTemplate } from '@/modules/superadmin/types';

const NR = 'font-[family-name:var(--font-nr)]';

/* Every Independent test organizers have actually built in their own Test
 * Builder, across every org. Read-only on purpose: editing stays in the org
 * that owns the template — this is the platform's visibility into what is
 * already live, which the catalog's Independent tab otherwise implied didn't
 * exist. */
export function IndependentTemplatesPanel({ templates }: { templates: IndependentTestTemplate[] }) {
  return (
    <div className="rounded-[14px] border border-[#E7EAEE] bg-white">
      <div className="flex flex-wrap items-center gap-3 border-b border-[#E7EAEE] px-5 py-4">
        <span className={`${NR} text-[20px] text-[#101828]`}>
          Organizer-built Independent tests
        </span>
        <span className="inline-flex h-5 items-center rounded-full bg-[#FDF2E3] px-[9px] text-[10.5px] font-bold text-[#B45309]">
          {templates.length}
        </span>
        <span className="ml-auto text-[12.5px] text-[#8A94A3]">
          Read-only — each organizer edits their own in Test Builder.
        </span>
      </div>

      {templates.length === 0 ? (
        <p className="px-5 py-[42px] text-center text-[13.5px] text-[#8A94A3]">
          No organization has built an Independent test yet.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-[13px]">
            <thead>
              <tr className="bg-[#FBFCFD] text-[10px] tracking-[.08em] text-[#475467] uppercase">
                <th className="px-5 py-[11px] text-left font-bold">Test</th>
                <th className="px-4 py-[11px] text-left font-bold">Level</th>
                <th className="px-4 py-[11px] text-left font-bold">Organizer</th>
                <th className="px-4 py-[11px] text-left font-bold">Source</th>
                <th className="px-5 py-[11px] text-left font-bold">Built</th>
              </tr>
            </thead>
            <tbody>
              {templates.map((template, i) => (
                <tr
                  key={template.id}
                  className="border-t border-[#EEF1F4]"
                  style={{ background: i % 2 ? '#FBFCFD' : '#FFFFFF' }}
                >
                  <td className="px-5 py-3 font-bold text-[#101828]">{template.name}</td>
                  <td className="px-4 py-3 text-[#475467]">{template.level ?? '—'}</td>
                  <td className="px-4 py-3 text-[#475467]">{template.orgName}</td>
                  <td className="px-4 py-3 text-[#475467]">{template.sourceLabel ?? '—'}</td>
                  <td className="px-5 py-3 text-[#8A94A3]">
                    {formatTimestamp(template.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

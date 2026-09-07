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
    <div className="rounded-[14px] border border-[#E2E8E4] bg-white">
      <div className="flex flex-wrap items-center gap-3 border-b border-[#E2E8E4] px-5 py-4">
        <span className={`${NR} text-hunter-deep text-[20px]`}>
          Organizer-built Independent tests
        </span>
        <span className="inline-flex h-5 items-center rounded-full bg-[#F9F0D8] px-[9px] text-[10.5px] font-bold text-[#8A6D14]">
          {templates.length}
        </span>
        <span className="text-fa-muted-2 ml-auto text-[12.5px]">
          Read-only — each organizer edits their own in Test Builder.
        </span>
      </div>

      {templates.length === 0 ? (
        <p className="text-fa-muted-2 px-5 py-[42px] text-center text-[13.5px]">
          No organization has built an Independent test yet.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-[13px]">
            <thead>
              <tr className="bg-[#F6F0E2] text-[10px] tracking-[0.14em] text-[#7A6A5C] uppercase">
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
                  className="border-t border-[#EEF2EF]"
                  style={{ background: i % 2 ? '#FBF7EC' : '#FFFFFF' }}
                >
                  <td className="text-hunter-deep px-5 py-3 font-bold">{template.name}</td>
                  <td className="text-fa-muted px-4 py-3">{template.level ?? '—'}</td>
                  <td className="text-fa-muted px-4 py-3">{template.orgName}</td>
                  <td className="text-fa-muted px-4 py-3">{template.sourceLabel ?? '—'}</td>
                  <td className="text-fa-muted-2 px-5 py-3">
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

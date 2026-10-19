import {
  Table,
  TableBody,
  TableCaption,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/ui/shadcn/table';
import type { PlatformAccount } from '@/modules/superadmin/types';
import { AddSuperAdminDialog } from '@/modules/superadmin/ui/add-super-admin-dialog';
import { SuperAdminRow } from '@/modules/superadmin/ui/super-admin-row';

export function SuperAdminsPanel({
  accounts,
  currentUserId,
}: {
  accounts: PlatformAccount[];
  currentUserId: string;
}) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <AddSuperAdminDialog />
        <span className="max-w-[560px] text-[13px] leading-relaxed text-[#475467]">
          Every Super Admin has identical full access — impersonate any organizer,
          suspend/reactivate accounts, everything.
        </span>
      </div>

      {accounts.length === 0 ? (
        <p className="rounded-xl border border-dashed border-[#E7EAEE] bg-white px-5 py-8 text-center text-sm text-[#475467]">
          No accounts yet.
        </p>
      ) : (
        <div className="rounded-xl border border-[#E7EAEE] bg-white">
          <Table className="border-collapse text-[13.5px]">
            <TableCaption className="sr-only">Every platform account</TableCaption>
            <TableHeader className="[&_tr]:border-0">
              <TableRow className="border-b-0 bg-[#EAF5EF] hover:bg-transparent">
                {['Name', 'Email', 'Role', 'Status', ''].map((heading, i) => (
                  <TableHead
                    key={heading || `actions-${String(i)}`}
                    scope="col"
                    className="h-auto px-3 py-2.5 text-left text-[11px] font-bold tracking-[0.04em] text-[#475467] uppercase last:text-right"
                  >
                    {heading}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {accounts.map((account) => (
                <SuperAdminRow key={account.id} account={account} currentUserId={currentUserId} />
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

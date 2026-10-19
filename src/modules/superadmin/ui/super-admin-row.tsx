import { TableCell, TableRow } from '@/shared/ui/shadcn/table';
import { StatusBadge, type StatusTone } from '@/shared/ui/status-badge';
import { OrgAvatar } from '@/shared/ui/organizer/org-avatar';
import type { PlatformAccount } from '@/modules/superadmin/types';
import { RemoveSuperAdminAction } from '@/modules/superadmin/ui/remove-super-admin-action';

const ROLE_TONE: Record<string, StatusTone> = {
  SuperAdmin: 'info',
  Organizer: 'success',
};

function roleLabel(role: string | null): string {
  if (!role) return 'Unassigned';

  return role === 'ShowAdmin' ? 'Show Admin' : role;
}

export function SuperAdminRow({
  account,
  currentUserId,
}: {
  account: PlatformAccount;
  currentUserId: string;
}) {
  return (
    <TableRow className="border-b border-[#E7EAEE] last:border-b-0 hover:bg-transparent">
      <TableCell className="px-3 py-2.5 font-semibold whitespace-normal text-[#101828]">
        <span className="flex items-center gap-2.5">
          <OrgAvatar name={account.name} size={30} className="rounded-[8px] text-[11px]" />
          {account.name}
        </span>
      </TableCell>
      <TableCell className="px-3 py-2.5 whitespace-normal text-[#475467]">
        {account.email}
      </TableCell>
      <TableCell className="px-3 py-2.5 whitespace-normal">
        <StatusBadge tone={account.role ? (ROLE_TONE[account.role] ?? 'neutral') : 'neutral'}>
          {roleLabel(account.role)}
        </StatusBadge>
      </TableCell>
      <TableCell className="px-3 py-2.5 whitespace-normal">
        {account.status === 'active' ? (
          <StatusBadge tone="success">Active</StatusBadge>
        ) : (
          <StatusBadge tone="warn">Invite pending</StatusBadge>
        )}
      </TableCell>
      <TableCell className="px-3 py-2.5 text-right whitespace-normal">
        {account.role === 'SuperAdmin' ? (
          <RemoveSuperAdminAction account={account} isSelf={account.id === currentUserId} />
        ) : (
          <span className="pr-1 text-[12px] text-[#8A94A3]">—</span>
        )}
      </TableCell>
    </TableRow>
  );
}

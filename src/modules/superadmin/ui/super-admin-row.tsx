import { TableCell, TableRow } from '@/shared/ui/shadcn/table';
import { StatusBadge, type StatusTone } from '@/shared/ui/status-badge';
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
    <TableRow className="border-border border-b last:border-b-0 hover:bg-transparent">
      <TableCell className="text-hunter-deep px-3 py-2.5 font-semibold whitespace-normal">
        {account.name}
      </TableCell>
      <TableCell className="text-fa-muted px-3 py-2.5 whitespace-normal">{account.email}</TableCell>
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
          <span className="text-fa-muted-2 pr-1 text-[12px]">—</span>
        )}
      </TableCell>
    </TableRow>
  );
}

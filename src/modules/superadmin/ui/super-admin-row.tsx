import { TableCell, TableRow } from '@/shared/ui/shadcn/table';
import { StatusBadge, type StatusTone } from '@/shared/ui/status-badge';
import type { PlatformAccount } from '@/modules/superadmin/types';
import { RemoveSuperAdminAction } from '@/modules/superadmin/ui/remove-super-admin-action';

/** Role → badge tone. SuperAdmin reads as the privileged role; Organizer as the customer. */
const ROLE_TONE: Record<string, StatusTone> = {
  SuperAdmin: 'info',
  Organizer: 'success',
};

function roleLabel(role: string | null): string {
  if (!role) return 'Unassigned';
  // 'ShowAdmin' → 'Show Admin', leave the rest as stored.
  return role === 'ShowAdmin' ? 'Show Admin' : role;
}

/** One row in the platform accounts table. */
export function SuperAdminRow({
  account,
  currentUserId,
}: {
  account: PlatformAccount;
  currentUserId: string;
}) {
  return (
    <TableRow className="hover:bg-transparent border-b border-border last:border-b-0">
      <TableCell className="whitespace-normal px-3 py-2.5 font-semibold text-hunter-deep">
        {account.name}
      </TableCell>
      <TableCell className="whitespace-normal px-3 py-2.5 text-fa-muted">{account.email}</TableCell>
      <TableCell className="whitespace-normal px-3 py-2.5">
        <StatusBadge tone={account.role ? (ROLE_TONE[account.role] ?? 'neutral') : 'neutral'}>
          {roleLabel(account.role)}
        </StatusBadge>
      </TableCell>
      <TableCell className="whitespace-normal px-3 py-2.5">
        {account.status === 'active' ? (
          <StatusBadge tone="success">Active</StatusBadge>
        ) : (
          <StatusBadge tone="warn">Invite pending</StatusBadge>
        )}
      </TableCell>
      <TableCell className="whitespace-normal px-3 py-2.5 text-right">
        {account.role === 'SuperAdmin' ? (
          <RemoveSuperAdminAction account={account} isSelf={account.id === currentUserId} />
        ) : (
          <span className="pr-1 text-[12px] text-fa-muted-2">—</span>
        )}
      </TableCell>
    </TableRow>
  );
}

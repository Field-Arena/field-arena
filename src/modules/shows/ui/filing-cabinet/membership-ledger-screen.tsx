'use client';

import { ScreenTitle, ScreenLede, Card } from '@/shared/ui/organizer/card';
import { StatusBadge, type StatusTone } from '@/shared/ui/status-badge';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/ui/shadcn/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/shadcn/select';
import { MEMBERSHIP_FLAG_LABELS } from '@/modules/shows/constants';
import type { MembershipLedgerPageData, MembershipFlag } from '@/modules/shows/data/membership-ledger-queries';
import {
  useLinkMembershipRecord,
  useSetMembershipVerificationStatus,
} from '@/modules/shows/hooks/use-membership-ledger-mutations';
import { MembershipCheckDialog } from '@/modules/shows/ui/filing-cabinet/membership-check-dialog';

const VERIFICATION_TONE: Record<string, StatusTone> = {
  unverified: 'neutral',
  verified: 'success',
  flagged: 'danger',
};

const VERIFICATION_LABEL: Record<string, string> = {
  unverified: 'Unverified',
  verified: 'Verified',
  flagged: 'Flagged',
};

export function MembershipLedgerScreen({ data }: { data: MembershipLedgerPageData }) {
  const { showId, showName, rows, orgMembers } = data;
  const linkMember = useLinkMembershipRecord();
  const setVerification = useSetMembershipVerificationStatus();

  return (
    <div className="text-ink-deep font-[family-name:var(--font-ar)]">
      <div className="mb-4">
        <ScreenTitle className="mb-1.5">Membership Ledger</ScreenTitle>
        <ScreenLede className="mb-0">
          A separate check from paying for {showName} — memberships, registrations, and
          qualification-adjacent identifiers, verified once per entry, not once per class.
        </ScreenLede>
      </div>

      {rows.length === 0 ? (
        <Card className="p-[18px_20px_20px]">
          <p className="py-8 text-center text-[13.5px] text-[#7A8781] italic">
            No entries yet — rows appear here alongside the Entry Ledger.
          </p>
        </Card>
      ) : (
        <Card className="overflow-x-auto p-0">
          <Table>
            <TableCaption className="sr-only">Membership ledger for {showName}</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead scope="col">Entry #</TableHead>
                <TableHead scope="col">Bridle #</TableHead>
                <TableHead scope="col">Rider / Horse</TableHead>
                <TableHead scope="col">Association</TableHead>
                <TableHead scope="col">Rider #</TableHead>
                <TableHead scope="col">Horse reg. #</TableHead>
                <TableHead scope="col">Owner #</TableHead>
                <TableHead scope="col">Flags</TableHead>
                <TableHead scope="col">Linked member</TableHead>
                <TableHead scope="col">Verification</TableHead>
                <TableHead scope="col" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.showEntryId}>
                  <TableCell>{row.entryNumber}</TableCell>
                  <TableCell>{row.bridleNumber}</TableCell>
                  <TableCell>
                    <div className="font-semibold">{row.riderName}</div>
                    <div className="text-[12px] text-[#7A8781]">{row.horseName}</div>
                    {(row.suggestedUsef ?? row.suggestedFei) && (
                      <div className="text-[11px] text-[#7A8781]">
                        On file: {[row.suggestedUsef, row.suggestedFei].filter(Boolean).join(' / ')}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>{row.association ?? '—'}</TableCell>
                  <TableCell>{row.riderMembershipNumber ?? '—'}</TableCell>
                  <TableCell>{row.horseRegistrationNumber ?? '—'}</TableCell>
                  <TableCell>{row.ownerMembershipNumber ?? '—'}</TableCell>
                  <TableCell className="max-w-[180px]">
                    {row.flags.length === 0 ? (
                      <span className="text-[#7A8781]">—</span>
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        {row.flags.map((flag: MembershipFlag) => (
                          <StatusBadge key={flag} tone="danger" className="text-[10px]">
                            {MEMBERSHIP_FLAG_LABELS[flag]}
                          </StatusBadge>
                        ))}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="min-w-[160px]">
                    <Select
                      value={row.linkedMemberId ?? 'none'}
                      onValueChange={(v) => {
                        linkMember.mutate({
                          showId,
                          showEntryId: row.showEntryId,
                          memberDatabaseId: v === 'none' ? null : v,
                        });
                      }}
                    >
                      <SelectTrigger className="h-8 w-full text-[12.5px]">
                        <SelectValue placeholder="Not linked" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Not linked</SelectItem>
                        {orgMembers.map((m) => (
                          <SelectItem key={m.id} value={m.id}>
                            {m.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="min-w-[150px]">
                    <Select
                      value={row.verificationStatus}
                      onValueChange={(v) => {
                        setVerification.mutate({
                          showId,
                          showEntryId: row.showEntryId,
                          verificationStatus: v as 'unverified' | 'verified' | 'flagged',
                        });
                      }}
                    >
                      <SelectTrigger className="h-8 w-full text-[12.5px]">
                        <StatusBadge tone={VERIFICATION_TONE[row.verificationStatus]}>
                          {VERIFICATION_LABEL[row.verificationStatus]}
                        </StatusBadge>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unverified">Unverified</SelectItem>
                        <SelectItem value="verified">Verified</SelectItem>
                        <SelectItem value="flagged">Flagged</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <MembershipCheckDialog showId={showId} row={row} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}

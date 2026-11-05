'use client';

import { cn } from '@/shared/lib/utils';
import {
  EmptyState,
  FA_TABLE,
  FA_TABLE_WRAP,
  FA_TD,
  FA_TH,
  FA_THEAD_ROW,
  FA_TR,
  Pill,
  type PillTone,
} from '@/shared/ui/organizer/fa-page';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/shadcn/select';
import { MEMBERSHIP_FLAG_LABELS } from '@/modules/shows/constants';
import type { MembershipFlag, MembershipLedgerPageData } from '@/modules/shows/types';
import {
  useLinkMembershipRecord,
  useSetMembershipVerificationStatus,
} from '@/modules/shows/hooks/use-membership-ledger-mutations';
import { MembershipCheckDialog } from '@/modules/shows/ui/filing-cabinet/membership-check-dialog';
import { CabinetSectionHead } from '@/modules/shows/ui/filing-cabinet/cabinet-section-head';

const VERIFICATION_TONE: Record<string, PillTone> = {
  unverified: 'grey',
  verified: 'green',
  flagged: 'red',
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
      <CabinetSectionHead
        title="Membership ledger"
        lede={
          <>
            A separate check from paying for {showName} — memberships, registrations, and
            qualification-adjacent identifiers, verified once per entry, not once per class.
          </>
        }
      />

      {rows.length === 0 ? (
        <EmptyState title="No entries yet" note="Rows appear here alongside the Entry Ledger." />
      ) : (
        <div className={FA_TABLE_WRAP}>
          <table className={FA_TABLE}>
            <caption className="sr-only">Membership ledger for {showName}</caption>
            <thead>
              <tr className={FA_THEAD_ROW}>
                <th scope="col" className={FA_TH}>
                  Entry #
                </th>
                <th scope="col" className={FA_TH}>
                  Bridle #
                </th>
                <th scope="col" className={FA_TH}>
                  Rider / Horse
                </th>
                <th scope="col" className={FA_TH}>
                  Association
                </th>
                <th scope="col" className={FA_TH}>
                  Rider #
                </th>
                <th scope="col" className={FA_TH}>
                  Horse reg. #
                </th>
                <th scope="col" className={FA_TH}>
                  Owner #
                </th>
                <th scope="col" className={FA_TH}>
                  Flags
                </th>
                <th scope="col" className={FA_TH}>
                  Linked member
                </th>
                <th scope="col" className={FA_TH}>
                  Verification
                </th>
                <th scope="col" className={FA_TH} />
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.showEntryId} className={FA_TR}>
                  <td className={FA_TD}>{row.entryNumber}</td>
                  <td className={FA_TD}>{row.bridleNumber}</td>
                  <td className={FA_TD}>
                    <div className="font-bold">{row.riderName}</div>
                    <div className="text-[12px] text-[#5A6B63]">{row.horseName}</div>
                    {(row.suggestedUsef ?? row.suggestedFei) && (
                      <div className="text-[11px] text-[#5A6B63]">
                        On file: {[row.suggestedUsef, row.suggestedFei].filter(Boolean).join(' / ')}
                      </div>
                    )}
                  </td>
                  <td className={FA_TD}>{row.association ?? '—'}</td>
                  <td className={FA_TD}>{row.riderMembershipNumber ?? '—'}</td>
                  <td className={FA_TD}>{row.horseRegistrationNumber ?? '—'}</td>
                  <td className={FA_TD}>{row.ownerMembershipNumber ?? '—'}</td>
                  <td className={cn(FA_TD, 'max-w-[180px]')}>
                    {row.flags.length === 0 ? (
                      <span className="text-[#5A6B63]">—</span>
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        {row.flags.map((flag: MembershipFlag) => (
                          <Pill key={flag} tone="red">
                            {MEMBERSHIP_FLAG_LABELS[flag]}
                          </Pill>
                        ))}
                      </div>
                    )}
                  </td>
                  <td className={cn(FA_TD, 'min-w-[160px]')}>
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
                      <SelectTrigger className="h-8 w-full rounded-[8px] border-[1.5px] border-[#C9D3CE] bg-white text-[12.5px] font-semibold">
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
                  </td>
                  <td className={cn(FA_TD, 'min-w-[150px]')}>
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
                      <SelectTrigger className="h-8 w-full rounded-[8px] border-[1.5px] border-[#C9D3CE] bg-white text-[12.5px] font-semibold">
                        <Pill tone={VERIFICATION_TONE[row.verificationStatus]}>
                          {VERIFICATION_LABEL[row.verificationStatus]}
                        </Pill>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unverified">Unverified</SelectItem>
                        <SelectItem value="verified">Verified</SelectItem>
                        <SelectItem value="flagged">Flagged</SelectItem>
                      </SelectContent>
                    </Select>
                  </td>
                  <td className={FA_TD}>
                    <MembershipCheckDialog showId={showId} row={row} />
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

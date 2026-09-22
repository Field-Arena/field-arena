import 'server-only';
import { getHorsesPageData, type HorsesPageData } from '@/modules/shows/data/horses-queries';
import { getTestPrintCounts, type TestPrintPageData } from '@/modules/shows/data/test-print-queries';
import { getRibbonCountReport, type RibbonCountPageData } from '@/modules/shows/data/ribbon-count-queries';
import { getEntryLedgerPageData, type EntryLedgerPageData } from '@/modules/shows/data/entry-ledger-queries';
import { getMembershipLedgerPageData } from '@/modules/shows/data/membership-ledger-queries';

export interface AssociationRevenueRow {
  association: string;
  entryCount: number;
  fees: number;
  amountPaid: number;
}

export interface QuickReportsPageData {
  showId: string;
  showName: string;
  horses: HorsesPageData;
  testPrint: TestPrintPageData;
  ribbons: RibbonCountPageData;
  ledger: EntryLedgerPageData;
  byAssociation: AssociationRevenueRow[];
}

export async function getQuickReportsPageData(showId: string): Promise<QuickReportsPageData | null> {
  const [horses, testPrint, ribbons, ledger, membership] = await Promise.all([
    getHorsesPageData(showId),
    getTestPrintCounts(showId),
    getRibbonCountReport(showId),
    getEntryLedgerPageData(showId),
    getMembershipLedgerPageData(showId),
  ]);

  if (!horses || !testPrint || !ribbons || !ledger || !membership) return null;

  const associationByEntry = new Map(
    membership.rows.map((row) => [row.showEntryId, row.association ?? 'Unaffiliated']),
  );
  const byAssociationMap = new Map<string, AssociationRevenueRow>();
  for (const entry of ledger.rows) {
    const association = associationByEntry.get(entry.showEntryId) ?? 'Unaffiliated';
    const existing = byAssociationMap.get(association) ?? {
      association,
      entryCount: 0,
      fees: 0,
      amountPaid: 0,
    };
    existing.entryCount += 1;
    existing.fees += entry.fees;
    existing.amountPaid += entry.amountPaid;
    byAssociationMap.set(association, existing);
  }
  const byAssociation = [...byAssociationMap.values()].sort((a, b) =>
    a.association.localeCompare(b.association),
  );

  return { showId, showName: horses.showName, horses, testPrint, ribbons, ledger, byAssociation };
}

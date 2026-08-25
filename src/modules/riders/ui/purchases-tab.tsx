'use client';

import { useState, type CSSProperties } from 'react';
import { useStablingForm } from '@/modules/riders/hooks/use-stabling-form';
import { classSubtitle } from '@/modules/riders/utils/class-subtitle';
import { computeStablingSummary } from '@/modules/riders/utils/compute-stabling-summary';
import { feeForEntry } from '@/modules/riders/utils/fee-for-entry';
import { summarizePurchases } from '@/modules/riders/utils/summarize-purchases';
import {
  LEGACY_COLOR,
  LegacySecTitle,
  legacyBlockTitleStyle,
  legacyButtonGhostStyle,
  legacyButtonPrimaryStyle,
  legacyCardStyle,
  legacyTableCellStyle,
  legacyTableHeadCellStyle,
  legacyTableStyle,
} from '@/modules/riders/ui/legacy-theme';
import type {
  AddOnWithRemaining,
  OrderRow,
  RiderEntryDetail,
  RiderRow,
  ShowRow,
} from '@/modules/riders/types';
import { formatMoneyExact } from '@/shared/lib/format/currency';
import { Button } from '@/shared/ui/shadcn/button';
import { Input } from '@/shared/ui/shadcn/input';
import { Label } from '@/shared/ui/shadcn/label';
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/ui/shadcn/table';

function classDisplayName(cls: { label: string; displayName: string | null }): string {
  return (cls.displayName?.trim() ?? '') || cls.label;
}

const fieldInputStyle: CSSProperties = {
  fontFamily: 'inherit',
  fontSize: 13,
  padding: '6px 10px',
  borderRadius: 8,
  border: `1px solid ${LEGACY_COLOR.border}`,
  width: '100%',
};

export function PurchasesTab({
  show,
  rider,
  entries,
  orders,
  addOns,
}: {
  show: ShowRow;
  rider: RiderRow;
  entries: RiderEntryDetail[];
  orders: OrderRow[];
  addOns: AddOnWithRemaining[];
}) {
  const [showReceipt, setShowReceipt] = useState(false);
  const summary = summarizePurchases(orders);
  const stabling = computeStablingSummary(orders, addOns);
  const paidOrders = orders.filter((order) => order.status === 'paid');
  const stablingOrder = paidOrders[0] ?? null;

  return (
    <div style={legacyCardStyle}>
      <LegacySecTitle>Your entries &amp; purchases</LegacySecTitle>

      <div style={legacyBlockTitleStyle}>Class entries</div>
      <Table style={legacyTableStyle}>
        <TableHeader>
          <TableRow>
            <TableHead style={legacyTableHeadCellStyle}>Class</TableHead>
            <TableHead style={legacyTableHeadCellStyle}>Division</TableHead>
            <TableHead style={legacyTableHeadCellStyle}>Date · time · ring</TableHead>
            <TableHead style={{ ...legacyTableHeadCellStyle, textAlign: 'right' }}>Fee</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {entries.length === 0 && (
            <TableRow>
              <TableCell style={legacyTableCellStyle} colSpan={4}>
                No classes entered yet.
              </TableCell>
            </TableRow>
          )}
          {entries.map((entry) => {
            const fee = feeForEntry(orders, entry.classId, entry.horseId);
            const subtitle = entry.class ? classSubtitle(entry.class) : null;
            return (
              <TableRow key={entry.id}>
                <TableCell style={legacyTableCellStyle}>
                  {entry.class ? classDisplayName(entry.class) : 'Class'}
                  {subtitle && (
                    <div
                      style={{ fontStyle: 'italic', fontSize: 11.5, color: LEGACY_COLOR.inkSoft }}
                    >
                      {subtitle}
                    </div>
                  )}
                </TableCell>
                <TableCell style={legacyTableCellStyle}>{entry.class?.division}</TableCell>
                <TableCell style={legacyTableCellStyle}>
                  {entry.class
                    ? [entry.class.date, entry.class.time, entry.class.arena]
                        .filter(Boolean)
                        .join(' · ')
                    : ''}
                </TableCell>
                <TableCell style={{ ...legacyTableCellStyle, textAlign: 'right' }}>
                  {fee != null ? formatMoneyExact(fee) : '—'}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      <div style={legacyBlockTitleStyle}>
        Stabling &amp; add-ons{' '}
        <span
          style={{
            fontSize: 10,
            fontWeight: 700,
            color: LEGACY_COLOR.amber,
            background: LEGACY_COLOR.amberBg,
            borderRadius: 6,
            padding: '2px 6px',
            textTransform: 'none',
            letterSpacing: 0,
            marginLeft: 6,
          }}
        >
          Auto-filled from checkout
        </span>
      </div>
      <Table style={legacyTableStyle}>
        <TableHeader>
          <TableRow>
            <TableHead style={legacyTableHeadCellStyle}>Item</TableHead>
            <TableHead style={{ ...legacyTableHeadCellStyle, textAlign: 'right' }}>Qty</TableHead>
            <TableHead style={{ ...legacyTableHeadCellStyle, textAlign: 'right' }}>
              Price
            </TableHead>
            <TableHead style={{ ...legacyTableHeadCellStyle, textAlign: 'right' }}>
              Total
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell style={legacyTableCellStyle}>Class entries ({entries.length})</TableCell>
            <TableCell style={{ ...legacyTableCellStyle, textAlign: 'right' }}>
              {entries.length}
            </TableCell>
            <TableCell style={{ ...legacyTableCellStyle, textAlign: 'right' }}>—</TableCell>
            <TableCell style={{ ...legacyTableCellStyle, textAlign: 'right' }}>
              {formatMoneyExact(summary.classEntriesTotal)}
            </TableCell>
          </TableRow>
          {summary.addOnLines.map((line, index) => (
            <TableRow key={`${line.label}-${String(index)}`}>
              <TableCell style={legacyTableCellStyle}>{line.label}</TableCell>
              <TableCell style={{ ...legacyTableCellStyle, textAlign: 'right' }}>
                {line.qty}
              </TableCell>
              <TableCell style={{ ...legacyTableCellStyle, textAlign: 'right' }}>
                {formatMoneyExact(line.unitPrice)}
              </TableCell>
              <TableCell style={{ ...legacyTableCellStyle, textAlign: 'right' }}>
                {formatMoneyExact(line.amount)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell
              style={{ ...legacyTableCellStyle, fontWeight: 700, borderBottom: 'none' }}
              colSpan={3}
            >
              Total paid
            </TableCell>
            <TableCell
              style={{
                ...legacyTableCellStyle,
                fontWeight: 700,
                borderBottom: 'none',
                textAlign: 'right',
              }}
            >
              {formatMoneyExact(summary.totalPaid)}
            </TableCell>
          </TableRow>
        </TableFooter>
      </Table>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '14px 0' }}>
        <Button
          type="button"
          variant="ghost"
          className="h-auto active:translate-y-0"
          style={legacyButtonGhostStyle}
          onClick={() => {
            setShowReceipt((value) => !value);
          }}
        >
          {showReceipt ? 'Hide receipt' : '🧾 View receipt'}
        </Button>
      </div>
      {showReceipt && (
        <Receipt
          show={show}
          rider={rider}
          summary={summary}
          order={stablingOrder}
          entriesCount={entries.length}
        />
      )}

      <div style={legacyBlockTitleStyle}>Stabling logistics</div>
      <p style={{ fontSize: 12.5, color: LEGACY_COLOR.inkSoft, margin: '0 0 12px' }}>
        Your stalls are reserved from checkout. Tell the show when you&apos;ll arrive and leave so
        they can assign them.
      </p>
      <StablingForm order={stablingOrder} stabling={stabling} />
    </div>
  );
}

function Receipt({
  show,
  rider,
  summary,
  order,
  entriesCount,
}: {
  show: ShowRow;
  rider: RiderRow;
  summary: ReturnType<typeof summarizePurchases>;
  order: OrderRow | null;
  entriesCount: number;
}) {
  return (
    <div
      style={{
        marginBottom: 16,
        padding: '18px 20px',
        borderRadius: 10,
        border: `1px solid ${LEGACY_COLOR.border}`,
        background: LEGACY_COLOR.white,
        fontSize: 13,
      }}
    >
      <p style={{ fontSize: 11.5, color: LEGACY_COLOR.inkSoft, margin: '0 0 2px' }}>
        From: Field &amp; Arena · notifications@field-arena.com
      </p>
      <p style={{ fontSize: 11.5, color: LEGACY_COLOR.inkSoft, margin: '0 0 10px' }}>
        To: {rider.email}
      </p>
      <p style={{ fontWeight: 700, color: LEGACY_COLOR.hunterDeep, margin: '0 0 8px' }}>
        Receipt — {show.name}
      </p>
      <p style={{ margin: '0 0 10px' }}>Hi {rider.first_name ?? 'there'},</p>
      <Table style={{ width: '100%', fontSize: 13 }}>
        <TableBody>
          <TableRow>
            <TableCell>Class entries ({entriesCount})</TableCell>
            <TableCell style={{ textAlign: 'right' }}>
              {formatMoneyExact(summary.classEntriesTotal)}
            </TableCell>
          </TableRow>
          {summary.addOnLines.map((line, index) => (
            <TableRow key={`${line.label}-${String(index)}`}>
              <TableCell>
                {line.label}
                {line.qty > 1 ? ` (×${String(line.qty)})` : ''}
              </TableCell>
              <TableCell style={{ textAlign: 'right' }}>{formatMoneyExact(line.amount)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <p style={{ fontWeight: 700, color: LEGACY_COLOR.hunterDeep, margin: '10px 0 0' }}>
        Total paid: {formatMoneyExact(summary.totalPaid)}
      </p>
      <p style={{ fontSize: 11.5, color: LEGACY_COLOR.inkSoft, margin: '10px 0 0' }}>
        Confirmation number: {order?.stripe_payment_intent_id ?? '—'}
      </p>
      <p style={{ fontSize: 11.5, color: LEGACY_COLOR.inkSoft, margin: '4px 0 0' }}>
        {[show.name, show.date_label, show.venue_name].filter(Boolean).join(' · ')}
      </p>
      <p style={{ fontSize: 11.5, color: LEGACY_COLOR.inkSoft, margin: '10px 0 0' }}>
        Questions? Contact the show office. — Field &amp; Arena
      </p>
    </div>
  );
}

function AutoField({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <Label style={{ display: 'block', fontSize: 11, color: LEGACY_COLOR.inkSoft, marginBottom: 4 }}>
        {label}{' '}
        <span
          style={{
            fontSize: 9,
            fontWeight: 700,
            color: LEGACY_COLOR.amber,
            background: LEGACY_COLOR.amberBg,
            borderRadius: 5,
            padding: '1px 5px',
          }}
        >
          Auto
        </span>
      </Label>
      <Input
        readOnly
        value={value}
        style={{ ...fieldInputStyle, background: LEGACY_COLOR.hunterPale }}
      />
    </div>
  );
}

function StablingForm({
  order,
  stabling,
}: {
  order: OrderRow | null;
  stabling: { stalls: number; tack: number; shavings: number; nights: number };
}) {
  const {
    arrivalDate,
    setArrivalDate,
    departureDate,
    setDepartureDate,
    submit,
    isPending,
    isSuccess,
    canSubmit,
  } = useStablingForm(order);

  return (
    <div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
          gap: 12,
        }}
      >
        <div>
          <Label
            style={{ display: 'block', fontSize: 11, color: LEGACY_COLOR.inkSoft, marginBottom: 4 }}
          >
            Arrival date <span style={{ color: LEGACY_COLOR.red }}>*</span>
          </Label>
          <Input
            type="date"
            value={arrivalDate}
            style={fieldInputStyle}
            onChange={(event) => {
              setArrivalDate(event.target.value);
            }}
          />
        </div>
        <div>
          <Label
            style={{ display: 'block', fontSize: 11, color: LEGACY_COLOR.inkSoft, marginBottom: 4 }}
          >
            Departure date <span style={{ color: LEGACY_COLOR.red }}>*</span>
          </Label>
          <Input
            type="date"
            value={departureDate}
            style={fieldInputStyle}
            onChange={(event) => {
              setDepartureDate(event.target.value);
            }}
          />
        </div>
        <AutoField label="Stalls reserved" value={stabling.stalls} />
        <AutoField label="Tack stalls" value={stabling.tack} />
        <AutoField label="Shavings bags" value={stabling.shavings} />
        <AutoField label="Nights reserved" value={stabling.nights} />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', marginTop: 12, gap: 12 }}>
        <Button
          type="button"
          className="h-auto active:translate-y-0"
          style={legacyButtonPrimaryStyle}
          disabled={!canSubmit || isPending}
          onClick={submit}
        >
          {isPending ? 'Saving…' : 'Save stabling details'}
        </Button>
        {isSuccess && (
          <span style={{ fontSize: 12.5, color: LEGACY_COLOR.green, fontWeight: 600 }}>
            ✓ Saved — the show has your dates.
          </span>
        )}
      </div>
      {!order && (
        <p style={{ fontSize: 12.5, color: LEGACY_COLOR.inkSoft, marginTop: 8 }}>
          Complete checkout before saving stabling dates.
        </p>
      )}
    </div>
  );
}

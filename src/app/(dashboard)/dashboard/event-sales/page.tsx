import type { Metadata } from 'next';
import { getOrganizerContext } from '@/modules/staff/data/context';
import { getSalesCatalog, type CatalogItem } from '@/modules/shows/data/setup-queries';
import { WorkspacePage, EmptyPanel } from '@/modules/staff/ui/workspace-page';
import { StatusBadge } from '@/shared/ui/status-badge';
import { formatMoney } from '@/shared/lib/format/currency';
import { calcPlatformFeeFlat8 } from '@/shared/lib/fees';

export const metadata: Metadata = { title: 'EventSales — Field & Arena' };

/**
 * Everything sellable at a show: rider add-ons, qualifying fees, vendor booths
 * and walk-up merchandise.
 *
 * The platform fee is shown per item because all four of these take a flat 8%
 * with no floor, regardless of the organization's fee model — that exception
 * lives only on class entries. Showing the fee next to the price is the clearest
 * way to make it true rather than remembered.
 */
export default async function EventSalesPage({
  searchParams,
}: {
  searchParams: Promise<{ show?: string }>;
}) {
  const { show: requestedShowId } = await searchParams;
  const context = await getOrganizerContext(requestedShowId);

  if (!context.currentShow) {
    return (
      <WorkspacePage
        title="EventSales"
        description="Add-ons, qualifying fees, vendor booths and merchandise."
        orgName={context.orgName}
        showPicker={false}
      >
        <EmptyPanel title="No shows yet" note="Sales catalogs are configured per show." />
      </WorkspacePage>
    );
  }

  const catalog = await getSalesCatalog(context.currentShow.id);

  return (
    <WorkspacePage
      title="EventSales"
      description="Add-ons, qualifying fees, vendor booths and merchandise."
      orgName={context.orgName}
      shows={context.shows}
      currentShow={context.currentShow}
    >
      <CatalogTable
        title="Rider add-ons"
        note="Stabling, shavings, tack stalls — things a rider buys alongside their entry."
        items={catalog.addOns}
        canViewMoney={context.canViewMoney}
      />

      <CatalogTable
        title="Qualifying fees"
        note="Per-class opt-ins into a governing body's qualifying track."
        items={catalog.qualTypes}
        canViewMoney={context.canViewMoney}
      />

      <CatalogTable
        title="Vendor booths"
        note="Space and services a vendor reserves for the show."
        items={catalog.vendorItems}
        canViewMoney={context.canViewMoney}
      />

      <h2 className="show-detail-title" style={{ marginTop: 26 }}>
        Merchandise
      </h2>
      {!catalog.merchEnabled ? (
        <EmptyPanel
          title="Merchandise is off"
          note="Turn it on in show setup to sell shirts, hats and other items at the ring."
        />
      ) : catalog.merchItems.length === 0 ? (
        <EmptyPanel title="No merch items" note="Merchandise is enabled but nothing is listed." />
      ) : (
        <>
          <div style={{ overflowX: 'auto', marginTop: 10 }}>
            <table>
              <caption className="sr-only">Merchandise items</caption>
              <thead>
                <tr>
                  <th scope="col">Item</th>
                  <th scope="col" className="r">
                    Price
                  </th>
                </tr>
              </thead>
              <tbody>
                {catalog.merchItems.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <strong>{item.name}</strong>
                    </td>
                    <td className="r">{formatMoney(item.price)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {context.canViewMoney && (
            <p className="doc-note">
              Walk-up merchandise sold so far: <strong>{formatMoney(catalog.merchSalesTotal)}</strong>
              . These are rung up by staff at the show, separate from rider checkout.
            </p>
          )}
        </>
      )}
    </WorkspacePage>
  );
}

function CatalogTable({
  title,
  note,
  items,
  canViewMoney,
}: {
  title: string;
  note: string;
  items: CatalogItem[];
  canViewMoney: boolean;
}) {
  return (
    <>
      <h2 className="show-detail-title" style={{ marginTop: 22 }}>
        {title}
      </h2>
      <p className="show-detail-meta">{note}</p>

      {items.length === 0 ? (
        <EmptyPanel title={`No ${title.toLowerCase()}`} note="Nothing configured for this show." />
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table>
            <caption className="sr-only">{title}</caption>
            <thead>
              <tr>
                <th scope="col">Item</th>
                <th scope="col" className="r">
                  Price
                </th>
                {canViewMoney && (
                  <th scope="col" className="r">
                    Platform fee
                  </th>
                )}
                <th scope="col" className="r">
                  Available
                </th>
                <th scope="col">State</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td>
                    <strong>{item.name}</strong>
                  </td>
                  <td className="r">{formatMoney(item.price)}</td>
                  {canViewMoney && (
                    <td className="r" style={{ color: 'var(--fa-muted)' }}>
                      {formatMoney(calcPlatformFeeFlat8(item.price))}
                    </td>
                  )}
                  <td className="r">{item.qty ?? 'Unlimited'}</td>
                  <td>
                    {item.enabled ? (
                      <StatusBadge tone="success">On sale</StatusBadge>
                    ) : (
                      <StatusBadge tone="neutral">Off</StatusBadge>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

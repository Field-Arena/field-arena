'use client';

import { Loader2Icon } from 'lucide-react';
import { Button } from '@/shared/ui/shadcn/button';
import { cn } from '@/shared/lib/utils';
import { VENDOR_SPACE_TEMPLATE } from '@/modules/shows/constants';
import { SectionFooter } from '@/modules/shows/ui/show-manager/section-footer';
import type { RiderEntriesData } from '@/modules/shows/data/setup-queries';
import {
  useCreateAddOn,
  useCreateQualType,
  useDeleteAddOn,
  useDeleteQualType,
  useLoadStandardVendorSpaces,
  useUpdateAddOn,
  useUpdateQualType,
} from '@/modules/shows/hooks/use-catalog-mutations';
import { CatalogListCard } from '@/modules/shows/ui/show-manager/catalog-list-card';
import { SM_GHOST_BTN } from '@/modules/shows/ui/show-manager/tokens';
import { NotPublishedBanner } from '@/modules/shows/ui/show-manager/not-published-banner';
import { BrandingCard } from '@/modules/shows/ui/show-manager/branding-card';
import { VendorMapCard } from '@/modules/shows/ui/show-manager/vendor-map-card';
import { VendorSpacesCard } from '@/modules/shows/ui/show-manager/vendor-spaces-card';

/**
 * Show Manager, Rider Entries tab.
 *
 * Despite the name this is not a list of entries — it is what riders can buy
 * alongside one: the show's branding, its add-ons, the vendor spaces and map,
 * and the qualifications a ride can count toward. The design's own Select
 * Events footer says as much ("Next: set up add-ons, vendor spaces, and
 * qualifications for riders to purchase").
 */
export function RiderEntriesPanel({ data }: { data: RiderEntriesData }) {
  const createAddOn = useCreateAddOn();
  const updateAddOn = useUpdateAddOn();
  const deleteAddOn = useDeleteAddOn();

  const createQual = useCreateQualType();
  const updateQual = useUpdateQualType();
  const deleteQual = useDeleteQualType();

  const loadStandard = useLoadStandardVendorSpaces();

  return (
    <>
      {!data.published && <NotPublishedBanner reason={data.notPublishedReason} />}

      <BrandingCard data={data} />

      <CatalogListCard
        title="Add-Ons"
        note="Stabling, tack stalls, shavings, and anything else a rider can add to their entry. Check which ones you're offering and set each fee."
        emptyNote="No add-ons configured — add whatever this show offers"
        placeholder="e.g. Overnight Stall"
        items={data.addOns}
        creating={createAddOn.isPending}
        onCreate={(name, price) => {
          createAddOn.mutate({ showId: data.showId, name, price, qty: '' });
        }}
        onRename={(item, name, price) => {
          updateAddOn.mutate({ id: item.id, name, price });
        }}
        onRemove={(id) => {
          deleteAddOn.mutate(id);
        }}
      />

      <VendorMapCard data={data} />

      <VendorSpacesCard
        data={data}
        extraAction={
          <Button
            type="button"
            variant="ghost"
            className={cn(SM_GHOST_BTN, 'hover:bg-white', 'mb-3 h-auto max-w-full text-left whitespace-normal')}
            disabled={loadStandard.isPending}
            onClick={() => {
              loadStandard.mutate(data.showId);
            }}
          >
            {loadStandard.isPending && <Loader2Icon className="size-4 animate-spin" aria-hidden />}+
            Load standard space list (
            {VENDOR_SPACE_TEMPLATE.map((t) => `${t.name} $${String(t.price)}`).join(', ')})
          </Button>
        }
      />

      <CatalogListCard
        title="Qualifications"
        note="Riders can add any of these to an individual class entry to have that ride count toward that body's year-end or regional qualifying scores. Check which ones you're offering and set each fee."
        emptyNote="No qualifications configured — add whatever this show offers"
        placeholder="e.g. Regional Championship"
        items={data.qualifications}
        creating={createQual.isPending}
        onCreate={(name, price) => {
          createQual.mutate({ showId: data.showId, name, price });
        }}
        onRename={(item, name, price) => {
          updateQual.mutate({ id: item.id, name, price });
        }}
        onRemove={(id) => {
          deleteQual.mutate(id);
        }}
      />

      <SectionFooter
        currentTab="Rider Entries"
        showId={data.showId}
        blockedReason={!data.published ? data.notPublishedReason : null}
      />
    </>
  );
}

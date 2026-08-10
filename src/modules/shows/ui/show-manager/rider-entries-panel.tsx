'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';
import { ArrowUpIcon, Loader2Icon } from 'lucide-react';
import { Card } from '@/shared/ui/organizer/card';
import { cn } from '@/shared/lib/utils';
import { VENDOR_SPACE_TEMPLATE } from '../../constants';
import { SectionFooter } from './section-footer';
import type { RiderEntriesData, VendorSpaceItem } from '../../data/setup-queries';
import {
  useCreateAddOn,
  useCreateQualType,
  useCreateVendorItem,
  useDeleteAddOn,
  useDeleteQualType,
  useDeleteVendorItem,
  useLoadStandardVendorSpaces,
  useRemoveVendorMap,
  useUpdateAddOn,
  useUpdateQualType,
  useUpdateVendorItem,
  useUploadShowBranding,
  useUploadVendorMap,
} from '../../hooks/use-catalog-mutations';
import { CatalogListCard } from './catalog-list-card';
import {
  SM_CARD_PAD,
  SM_SECTION_HEAD,
  SM_NOTE,
  SM_ROW_INPUT,
  SM_GREEN_BTN,
  SM_GHOST_BTN,
} from './tokens';

/** Server Actions take bytes as base64, matching the superadmin upload path. */
function readFile(file: File): Promise<{ dataBase64: string; contentType: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      resolve({
        dataBase64: result.split(',')[1] ?? '',
        contentType: file.type || 'application/octet-stream',
      });
    };
    reader.onerror = () => {
      reject(new Error('Could not read that file'));
    };
    reader.readAsDataURL(file);
  });
}

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
          <button
            type="button"
            className={cn(SM_GHOST_BTN, 'mb-3 h-auto max-w-full text-left whitespace-normal')}
            disabled={loadStandard.isPending}
            onClick={() => {
              loadStandard.mutate(data.showId);
            }}
          >
            {loadStandard.isPending && <Loader2Icon className="size-4 animate-spin" aria-hidden />}+
            Load standard space list (
            {VENDOR_SPACE_TEMPLATE.map((t) => `${t.name} $${String(t.price)}`).join(', ')})
          </button>
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

function NotPublishedBanner({ reason }: { reason: string | null }) {
  return (
    <div className="rounded-[10px] border border-l-[3px] border-[#E9EDEB] border-l-[#B4432F] bg-white px-[18px] py-4">
      <p className="text-ink-deep text-[13.5px]">
        <strong>Not published</strong> — riders can&apos;t see this show or buy tickets yet.
      </p>
      {reason && <p className="mt-1 text-[12.5px] text-[#B4432F] italic">{reason}</p>}
    </div>
  );
}

function BrandingCard({ data }: { data: RiderEntriesData }) {
  return (
    <Card className={SM_CARD_PAD}>
      <h2 className={SM_SECTION_HEAD}>Branding</h2>
      <div className="grid gap-5 sm:grid-cols-[minmax(0,220px)_minmax(0,1fr)]">
        <BrandingSlot
          showId={data.showId}
          kind="logo"
          label="Logo"
          hint="Square · ticket page &amp; listings"
          prompt="Drop or click"
          url={data.logoUrl}
        />
        <BrandingSlot
          showId={data.showId}
          kind="banner"
          label="One-sheet / banner"
          hint="Runs wide across the ticket page"
          prompt="Drop or click — a flyer, venue photo, or past-show shot all work"
          url={data.bannerUrl}
        />
      </div>
    </Card>
  );
}

function BrandingSlot({
  showId,
  kind,
  label,
  hint,
  prompt,
  url,
}: {
  showId: string;
  kind: 'logo' | 'banner';
  label: string;
  hint: string;
  prompt: string;
  url: string | null;
}) {
  const upload = useUploadShowBranding();

  return (
    <div>
      <div className="text-ink-deep text-[13px] font-bold">{label}</div>
      <div className="mb-2 text-[11.5px] text-[#98A29D]">{hint}</div>

      <label
        className={cn(
          'grid min-h-[104px] cursor-pointer place-items-center gap-1.5 rounded-[10px]',
          'border border-dashed border-[#D9E1DD] bg-white p-3 text-center transition-colors',
          'hover:border-gold',
        )}
      >
        <input
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            void readFile(file).then(({ dataBase64, contentType }) => {
              upload.mutate({ showId, kind, name: file.name, dataBase64, contentType });
            });
          }}
        />
        {upload.isPending ? (
          <Loader2Icon className="size-5 animate-spin text-[#6E7C76]" aria-hidden />
        ) : url ? (
          <Image
            src={url}
            alt={`${label} for this show`}
            width={320}
            height={104}
            unoptimized
            className="max-h-[104px] w-auto object-contain"
          />
        ) : (
          <>
            <ArrowUpIcon className="size-[17px] text-[#6E7C76]" aria-hidden />
            <span className="text-[12.5px] text-[#6E7C76]">{prompt}</span>
          </>
        )}
      </label>
    </div>
  );
}

function VendorMapCard({ data }: { data: RiderEntriesData }) {
  const [file, setFile] = useState<File | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const upload = useUploadVendorMap();
  const remove = useRemoveVendorMap();

  return (
    <Card className={SM_CARD_PAD}>
      <h2 className={SM_SECTION_HEAD}>Vendor Space Map</h2>
      <p className={SM_NOTE}>
        Upload a booth/space layout map (PDF or image) — shown to vendors applying for this show so
        they can pick a spot.
      </p>

      {data.vendorMapUrl ? (
        <p className="mb-3 text-[13px]">
          <a
            href={data.vendorMapUrl}
            target="_blank"
            rel="noreferrer"
            className="text-forest font-semibold underline"
          >
            View the uploaded map
          </a>
        </p>
      ) : (
        <p className="mb-3 text-[13px] text-[#98A29D] italic">No map uploaded yet</p>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <input
          ref={inputRef}
          type="file"
          accept="image/*,application/pdf"
          className="file:text-forest hover:file:border-gold cursor-pointer text-[12.5px] text-[#6E7C76] file:mr-3 file:cursor-pointer file:rounded-[9px] file:border file:border-[#D9E1DD] file:bg-white file:px-3.5 file:py-2 file:text-[12.5px] file:font-semibold"
          onChange={(e) => {
            setFile(e.target.files?.[0] ?? null);
          }}
          aria-label="Vendor space map file"
        />
        <button
          type="button"
          className={SM_GREEN_BTN}
          disabled={!file || upload.isPending}
          onClick={() => {
            if (!file) return;
            void readFile(file).then(({ dataBase64, contentType }) => {
              upload.mutate(
                { showId: data.showId, name: file.name, dataBase64, contentType },
                {
                  onSuccess: () => {
                    setFile(null);
                    if (inputRef.current) inputRef.current.value = '';
                  },
                },
              );
            });
          }}
        >
          {upload.isPending && <Loader2Icon className="size-4 animate-spin" aria-hidden />}
          Upload map
        </button>

        {data.vendorMapUrl && (
          <button
            type="button"
            className={SM_GHOST_BTN}
            disabled={remove.isPending}
            onClick={() => {
              remove.mutate(data.showId);
            }}
          >
            Remove map
          </button>
        )}
      </div>
    </Card>
  );
}

function VendorSpacesCard({
  data,
  extraAction,
}: {
  data: RiderEntriesData;
  extraAction: React.ReactNode;
}) {
  const [name, setName] = useState('');
  const [qty, setQty] = useState('');
  const [price, setPrice] = useState('0');

  const create = useCreateVendorItem();

  function add() {
    if (!name.trim()) return;
    create.mutate(
      { showId: data.showId, name: name.trim(), price: Number(price) || 0, qty },
      {
        onSuccess: () => {
          setName('');
          setQty('');
          setPrice('0');
        },
      },
    );
  }

  return (
    <Card className={SM_CARD_PAD}>
      <h2 className={SM_SECTION_HEAD}>Vendor Spaces</h2>
      <p className={SM_NOTE}>
        Booth/table spaces vendors can book at this show. Check which ones you&apos;re offering, set
        each fee, and cap availability if you have a limited number of spots.
      </p>

      {extraAction}

      {data.vendorSpaces.length === 0 ? (
        <p className="mb-3 text-[13px] text-[#98A29D] italic">
          No vendor spaces configured — add whatever this show offers
        </p>
      ) : (
        <div className="mb-3 flex flex-col gap-2">
          {data.vendorSpaces.map((space) => (
            <VendorSpaceRow key={space.id} space={space} />
          ))}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <input
          className={`${SM_ROW_INPUT} min-w-[200px] flex-1`}
          placeholder="e.g. 10x10 Booth"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
          }}
          aria-label="New vendor space name"
        />
        <span className="text-[13px] text-[#6E7C76]">Qty</span>
        <input
          className={`${SM_ROW_INPUT} w-[86px] flex-none`}
          placeholder="∞"
          inputMode="numeric"
          value={qty}
          onChange={(e) => {
            setQty(e.target.value);
          }}
          aria-label="New vendor space quantity"
        />
        <span className="text-[13px] text-[#6E7C76]">$</span>
        <input
          className={`${SM_ROW_INPUT} w-[110px] flex-none`}
          inputMode="numeric"
          value={price}
          onChange={(e) => {
            setPrice(e.target.value);
          }}
          aria-label="New vendor space price"
        />
        <button
          type="button"
          className={SM_GREEN_BTN}
          disabled={create.isPending || !name.trim()}
          onClick={add}
        >
          {create.isPending && <Loader2Icon className="size-4 animate-spin" aria-hidden />}+ Add
        </button>
      </div>
    </Card>
  );
}

function VendorSpaceRow({ space }: { space: VendorSpaceItem }) {
  const [name, setName] = useState(space.name);
  const [qty, setQty] = useState(space.qty === null ? '' : String(space.qty));
  const [price, setPrice] = useState(String(space.price));

  const update = useUpdateVendorItem();
  const remove = useDeleteVendorItem();

  function commit() {
    const nextName = name.trim();
    if (!nextName) return;
    update.mutate({ id: space.id, name: nextName, price: Number(price) || 0, qty });
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <input
        className={`${SM_ROW_INPUT} min-w-[200px] flex-1`}
        value={name}
        onChange={(e) => {
          setName(e.target.value);
        }}
        onBlur={commit}
        aria-label={`${space.name} name`}
      />
      <span className="text-[13px] text-[#6E7C76]">Qty</span>
      <input
        className={`${SM_ROW_INPUT} w-[86px] flex-none`}
        placeholder="∞"
        inputMode="numeric"
        value={qty}
        onChange={(e) => {
          setQty(e.target.value);
        }}
        onBlur={commit}
        aria-label={`${space.name} quantity`}
      />
      <span className="text-[13px] text-[#6E7C76]">$</span>
      <input
        className={`${SM_ROW_INPUT} w-[110px] flex-none`}
        inputMode="numeric"
        value={price}
        onChange={(e) => {
          setPrice(e.target.value);
        }}
        onBlur={commit}
        aria-label={`${space.name} price`}
      />
      <button
        type="button"
        onClick={() => {
          remove.mutate(space.id);
        }}
        className="flex-none rounded-[9px] border border-[#E4B5AC] bg-[#FDF0EE] px-3.5 py-2.5 text-[12.5px] font-semibold text-[#B4432F] transition-colors hover:border-[#B4432F]"
      >
        Remove
      </button>
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { StepPillNav, type StepPillNavStep } from '@/shared/ui/step-pill-nav';
import { SUPERADMIN_CONSOLE_ROUTE } from '@/modules/riders/constants';
import { useEntryCartStore } from '@/modules/riders/store';
import { ClassPicker } from '@/modules/riders/ui/class-picker';
import { AddOnPicker } from '@/modules/riders/ui/addon-picker';
import { RiderDemoAccountStep } from '@/modules/riders/ui/rider-demo-account-step';
import { RiderDemoDetailsStep } from '@/modules/riders/ui/rider-demo-details-step';
import { RiderDemoPaymentStep } from '@/modules/riders/ui/rider-demo-payment-step';
import { CheckoutConfirmation } from '@/modules/riders/ui/checkout-confirmation';
import type {
  AddOnWithRemaining,
  ClassWithCapacity,
  FinalizeOrderResult,
  QualTypeRow,
} from '@/modules/riders/types';

const DEMO_SHOW_ID = 'demo-show';

const CLASS_DEFAULTS = {
  arena: 'Ring 1',
  award_scope: 'class',
  catalog_id: null,
  created_at: '2026-01-01T00:00:00.000Z',
  display_name: null,
  division: null,
  event: null,
  governing_body: 'USEF',
  group_name: null,
  judges_count: null,
  location: null,
  min_per_ride: null,
  price_edited: null,
  qual_fee: null,
  qual_types: null,
  qualifying: null,
  results_published: null,
  results_published_at: null,
  ribbon_colors: null,
  ribbon_places: null,
  score_format: null,
  scoring_open: null,
  scoring_pos: null,
  run_order: null,
  sponsor: null,
  show_id: DEMO_SHOW_ID,
  test_options: null,
  time: '9:00 AM',
  working_in_entry_id: null,
};

const DEMO_CLASSES: ClassWithCapacity[] = [
  {
    ...CLASS_DEFAULTS,
    id: 'demo-class-1',
    label: 'Training Level Test 1',
    date: '2026-09-12',
    fee: 65,
    entryCount: 8,
    cap: 20,
  },
  {
    ...CLASS_DEFAULTS,
    id: 'demo-class-2',
    label: 'First Level Test 2',
    date: '2026-09-12',
    fee: 75,
    entryCount: 5,
    cap: null,
  },
];

const DEMO_ADD_ONS: AddOnWithRemaining[] = [
  {
    id: 'demo-addon-1',
    name: 'Overnight stall',
    nights: 2,
    price: 45,
    qty: 30,
    shavings: null,
    show_id: DEMO_SHOW_ID,
    stalls: 1,
    tack: null,
    enabled: true,
    remaining: 12,
  },
];

const DEMO_QUAL_TYPES: QualTypeRow[] = [
  {
    id: 'demo-qual-1',
    name: 'Regional Championship qualifier',
    price: 15,
    show_id: DEMO_SHOW_ID,
    enabled: true,
  },
];

const DEMO_RESULT: FinalizeOrderResult = {
  ok: true,
  entries: [],
  riderNumber: '214',
  orderId: 'demo-order',
  total: 0,
  items: [
    {
      kind: 'class_entry',
      label: 'Training Level Test 1 — Willow',
      qty: 1,
      unitPrice: 65,
      amount: 65 + 7.99,
    },
    { kind: 'addon', label: 'Overnight stall × 2', qty: 2, unitPrice: 45, amount: 2 * (45 + 3.6) },
  ],
};
DEMO_RESULT.total = DEMO_RESULT.items.reduce((sum, item) => sum + item.amount, 0);

const STEPS: StepPillNavStep[] = [
  {
    key: 'tickets',
    label: 'Choose tickets',
    title: 'Choose tickets',
    sub: 'Pick classes and add-ons for the show.',
  },
  {
    key: 'account',
    label: 'Your account',
    title: 'Your account',
    sub: 'Sign up / sign in — demo mode skips real auth.',
  },
  {
    key: 'details',
    label: 'Rider details & waiver',
    title: 'Rider details & waiver',
    sub: 'Horse info, required documents, and the waiver of liability.',
  },
  { key: 'payment', label: 'Payment', title: 'Payment', sub: 'Order summary and payment step.' },
  {
    key: 'confirmation',
    label: 'Confirmation',
    title: 'Confirmation',
    sub: 'What a rider sees immediately after a successful (demo) payment.',
  },
];

export function RiderDemoWalkthrough({
  showBackToConsole = false,
}: {
  showBackToConsole?: boolean;
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const reset = useEntryCartStore((state) => state.reset);

  useEffect(() => {
    reset();
    return () => {
      reset();
    };
  }, [reset]);

  return (
    <>
      {showBackToConsole && (
        <div className="flex items-center border-b border-[#E9EDEB] bg-white px-5 py-2.5">
          <Link
            href={SUPERADMIN_CONSOLE_ROUTE}
            className="text-forest hover:text-gold inline-flex items-center gap-1.5 text-[13px] font-semibold transition-colors"
          >
            ← Back to console
          </Link>
        </div>
      )}
      <StepPillNav
        steps={STEPS}
        activeIndex={activeIndex}
        onJump={setActiveIndex}
        onPrev={() => {
          setActiveIndex((i) => Math.max(0, i - 1));
        }}
        onNext={() => {
          setActiveIndex((i) => Math.min(STEPS.length - 1, i + 1));
        }}
      >
        <div className="mx-auto max-w-2xl space-y-6">
          {activeIndex === 0 && (
            <>
              <ClassPicker classes={DEMO_CLASSES} qualTypes={DEMO_QUAL_TYPES} />
              <AddOnPicker addOns={DEMO_ADD_ONS} />
            </>
          )}
          {activeIndex === 1 && (
            <RiderDemoAccountStep
              onNext={() => {
                setActiveIndex(2);
              }}
            />
          )}
          {activeIndex === 2 && (
            <RiderDemoDetailsStep
              onNext={() => {
                setActiveIndex(3);
              }}
            />
          )}
          {activeIndex === 3 && (
            <RiderDemoPaymentStep
              classes={DEMO_CLASSES}
              addOns={DEMO_ADD_ONS}
              qualTypes={DEMO_QUAL_TYPES}
              onNext={() => {
                setActiveIndex(4);
              }}
            />
          )}
          {activeIndex === 4 && <CheckoutConfirmation result={DEMO_RESULT} showId={DEMO_SHOW_ID} />}
        </div>
      </StepPillNav>
    </>
  );
}

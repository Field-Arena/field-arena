'use client';

import { useEffect, useState } from 'react';
import { StepPillNav, type StepPillNavStep } from '@/shared/ui/step-pill-nav';
import { useEntryCartStore } from '../store';
import { ClassPicker } from './class-picker';
import { AddOnPicker } from './addon-picker';
import { RiderDemoAccountStep } from './rider-demo-account-step';
import { RiderDemoDetailsStep } from './rider-demo-details-step';
import { RiderDemoPaymentStep } from './rider-demo-payment-step';
import { CheckoutConfirmation } from './checkout-confirmation';
import type { AddOnWithRemaining, ClassWithCapacity, FinalizeOrderResult, QualTypeRow } from '../types';

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
  show_id: DEMO_SHOW_ID,
  test_options: null,
  time: '9:00 AM',
  working_in_entry_id: null,
};

/**
 * Hardcoded seed data for the "Demo" walkthrough — continues legacy's own
 * demo identity (seedRiderDemo, rider.html: Amanda Clarke / horse Willow)
 * rather than inventing new placeholder names. Deliberately not fetched from
 * Supabase: this route has zero real writes anywhere, so it has no real show
 * to read either.
 */
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
  { id: 'demo-qual-1', name: 'Regional Championship qualifier', price: 15, show_id: DEMO_SHOW_ID, enabled: true },
];

const DEMO_RESULT: FinalizeOrderResult = {
  ok: true,
  entries: [],
  riderNumber: '214',
  orderId: 'demo-order',
  total: 0,
  items: [
    { kind: 'class_entry', label: 'Training Level Test 1 — Willow', qty: 1, unitPrice: 65, amount: 65 + 7.99 },
    { kind: 'addon', label: 'Overnight stall × 2', qty: 2, unitPrice: 45, amount: 2 * (45 + 3.6) },
  ],
};
DEMO_RESULT.total = DEMO_RESULT.items.reduce((sum, item) => sum + item.amount, 0);

const STEPS: StepPillNavStep[] = [
  { key: 'tickets', label: 'Choose tickets', title: 'Choose tickets', sub: 'Pick classes and add-ons for the show.' },
  { key: 'account', label: 'Your account', title: 'Your account', sub: 'Sign up / sign in — demo mode skips real auth.' },
  { key: 'details', label: 'Rider details & waiver', title: 'Rider details & waiver', sub: 'Horse info, required documents, and the waiver of liability.' },
  { key: 'payment', label: 'Payment', title: 'Payment', sub: 'Order summary and payment step.' },
  { key: 'confirmation', label: 'Confirmation', title: 'Confirmation', sub: 'What a rider sees immediately after a successful (demo) payment.' },
];

/**
 * The restored "Demo" button's destination (public route `/rider/demo`, no
 * auth gate — same as legacy's preview-rider-demo.html) — reproduces that
 * page's exact 5-step sequence against the real rider UI components wherever
 * that's safe (ClassPicker/AddOnPicker only touch local Zustand state;
 * CheckoutConfirmation is pure-presentational), and demo-only stand-ins for
 * the three steps whose real counterparts fire real mutations. Zero
 * Supabase writes anywhere in this component tree.
 */
export function RiderDemoWalkthrough() {
  const [activeIndex, setActiveIndex] = useState(0);
  const reset = useEntryCartStore((state) => state.reset);

  // The entry cart is a single app-wide store — reset on mount so a stray
  // real cart never leaks into the demo, and again on unmount so a demo cart
  // never leaks into a real rider page visited afterward in the same tab.
  useEffect(() => {
    reset();
    return () => {
      reset();
    };
  }, [reset]);

  return (
    <StepPillNav
      steps={STEPS}
      activeIndex={activeIndex}
      onJump={setActiveIndex}
      onPrev={() => { setActiveIndex((i) => Math.max(0, i - 1)); }}
      onNext={() => { setActiveIndex((i) => Math.min(STEPS.length - 1, i + 1)); }}
    >
      <div className="mx-auto max-w-2xl space-y-6">
        {activeIndex === 0 && (
          <>
            <ClassPicker classes={DEMO_CLASSES} qualTypes={DEMO_QUAL_TYPES} />
            <AddOnPicker addOns={DEMO_ADD_ONS} />
          </>
        )}
        {activeIndex === 1 && (
          <RiderDemoAccountStep onNext={() => { setActiveIndex(2); }} />
        )}
        {activeIndex === 2 && (
          <RiderDemoDetailsStep onNext={() => { setActiveIndex(3); }} />
        )}
        {activeIndex === 3 && (
          <RiderDemoPaymentStep
            classes={DEMO_CLASSES}
            addOns={DEMO_ADD_ONS}
            qualTypes={DEMO_QUAL_TYPES}
            onNext={() => { setActiveIndex(4); }}
          />
        )}
        {activeIndex === 4 && <CheckoutConfirmation result={DEMO_RESULT} showId={DEMO_SHOW_ID} />}
      </div>
    </StepPillNav>
  );
}

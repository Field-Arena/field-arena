import type { Metadata } from 'next';
import { RiderDemoWalkthrough } from '@/modules/riders/ui/rider-demo-walkthrough';

export const metadata: Metadata = { title: 'Rider Signup Demo — Field & Arena' };

/**
 * The real rider experience, screen by screen — ported from legacy's
 * preview-rider-demo.html, which drove rider.html's own demo mode
 * (jumpToStep/payNow) through an iframe. This is that same idea against the
 * now-real rider flow: see rider-demo-walkthrough.tsx for why each step
 * either reuses a real component (safe — no data writes) or a demo-only
 * stand-in (the three steps whose real counterparts write real data).
 *
 * Public, no auth gate — same as legacy's demo, and the SuperAdmin console's
 * restored "Demo" button (src/modules/superadmin/constants.ts) just links
 * here rather than reimplementing this on the SuperAdmin side.
 */
export default function RiderDemoPage() {
  return <RiderDemoWalkthrough />;
}

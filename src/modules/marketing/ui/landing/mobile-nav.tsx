'use client';

import { useState } from 'react';
import Link from 'next/link';
import { MenuIcon, XIcon } from 'lucide-react';
import { NAV_LINKS } from '@/modules/marketing/landing-content';
import { LoginTrigger } from '@/modules/auth/ui/login-trigger';
import { DemoTrigger } from '@/modules/marketing/ui/landing/demo-trigger';
import { Button } from '@/shared/ui/shadcn/button';

/**
 * The only client component on the landing page.
 *
 * The design reference is desktop-only and ships no JavaScript at all — the
 * marquee and pulsing dots are CSS. Below 1024px the nav links have to collapse
 * behind a hamburger, and that needs open/closed state.
 */
export function LandingMobileNav() {
  const [open, setOpen] = useState(false);
  const close = () => {
    setOpen(false);
  };

  return (
    <div className="lg:hidden">
      <Button
        type="button"
        variant="ghost"
        aria-label={open ? 'Close menu' : 'Open menu'}
        aria-expanded={open}
        onClick={() => {
          setOpen((current) => !current);
        }}
        className="flex size-10 items-center justify-center rounded-lg p-0 text-paper transition-colors hover:bg-[rgba(255,255,255,.08)]"
      >
        {open ? <XIcon className="size-[22px]" /> : <MenuIcon className="size-[22px]" />}
      </Button>

      {open && (
        <nav className="absolute inset-x-0 top-full border-b border-[rgba(255,255,255,.09)] bg-forest px-6 pb-6 pt-2 shadow-[0_20px_44px_rgba(0,0,0,.32)]">
          <div className="flex flex-col">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                onClick={close}
                className="border-b border-[rgba(255,255,255,.09)] py-3.5 text-[15px] font-medium text-[rgba(251,250,247,.72)] transition-colors hover:text-gold"
              >
                {link.label}
              </Link>
            ))}
            <LoginTrigger className="border-b border-[rgba(255,255,255,.09)] py-3.5 text-left text-[15px] font-medium text-[rgba(251,250,247,.72)] transition-colors hover:text-gold">
              Log in
            </LoginTrigger>
            <DemoTrigger className="mt-4 rounded-lg bg-gold px-5 py-3 text-center text-sm font-bold text-forest">
              Book a demo
            </DemoTrigger>
          </div>
        </nav>
      )}
    </div>
  );
}

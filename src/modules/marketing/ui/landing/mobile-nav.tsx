'use client';

import { useState } from 'react';
import Link from 'next/link';
import { MenuIcon, XIcon } from 'lucide-react';
import { NAV_LINKS } from '@/modules/marketing/landing-content';
import { LoginTrigger } from '@/modules/auth/ui/login-trigger';
import { DemoTrigger } from '@/modules/marketing/ui/landing/demo-trigger';
import { Button } from '@/shared/ui/shadcn/button';

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
        className="text-paper flex size-10 items-center justify-center rounded-lg p-0 transition-colors hover:bg-[rgba(255,255,255,.08)]"
      >
        {open ? <XIcon className="size-[22px]" /> : <MenuIcon className="size-[22px]" />}
      </Button>

      {open && (
        <nav className="bg-forest absolute inset-x-0 top-full border-b border-[rgba(255,255,255,.09)] px-6 pt-2 pb-6 shadow-[0_20px_44px_rgba(0,0,0,.32)]">
          <div className="flex flex-col">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                onClick={close}
                className="hover:text-gold border-b border-[rgba(255,255,255,.09)] py-3.5 text-[15px] font-medium text-[rgba(251,250,247,.72)] transition-colors"
              >
                {link.label}
              </Link>
            ))}
            <LoginTrigger className="hover:text-gold border-b border-[rgba(255,255,255,.09)] py-3.5 text-left text-[15px] font-medium text-[rgba(251,250,247,.72)] transition-colors">
              Log in
            </LoginTrigger>
            <DemoTrigger className="bg-gold text-forest mt-4 rounded-lg px-5 py-3 text-center text-sm font-bold">
              Book a demo
            </DemoTrigger>
          </div>
        </nav>
      )}
    </div>
  );
}

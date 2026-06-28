'use client';

import { Menu, X } from 'lucide-react';
import { useState, type ReactNode } from 'react';

import { cn } from '@/lib/utils';

export interface MobileSidebarWrapperProps {
  sidebar: ReactNode;
  children: ReactNode;
}

export default function MobileSidebarWrapper({
  sidebar,
  children,
}: MobileSidebarWrapperProps) {
  const [open, setOpen] = useState(false);

  function openSidebar() {
    setOpen(true);
  }

  function closeSidebar() {
    setOpen(false);
  }

  return (
    <>
      {/* Bouton hamburger — mobile uniquement */}
      <button
        type="button"
        onClick={openSidebar}
        className={cn(
          'fixed left-4 top-4 z-50 flex h-10 w-10 items-center justify-center',
          'rounded-lg bg-[#0D3570] text-white shadow-md',
          'lg:hidden',
        )}
        aria-label="Ouvrir le menu"
        aria-expanded={open}
      >
        <Menu className="size-5" aria-hidden />
      </button>

      {/* Overlay — mobile uniquement, visible quand ouvert */}
      {open ? (
        <div
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          onClick={closeSidebar}
          aria-hidden
        />
      ) : null}

      {/* Conteneur sidebar — slide sur mobile, fixe sur desktop */}
      <div
        className={cn(
          'fixed left-0 top-0 z-40 h-screen w-[260px]',
          'transition-transform duration-300',
          open ? 'translate-x-0' : '-translate-x-full',
          'lg:translate-x-0',
        )}
      >
        <button
          type="button"
          onClick={closeSidebar}
          className={cn(
            'absolute right-3 top-4 z-50 flex h-8 w-8 items-center justify-center',
            'rounded-lg bg-white/20 text-white shadow-sm',
            'lg:hidden',
          )}
          aria-label="Fermer le menu"
        >
          <X className="size-4" aria-hidden />
        </button>
        {sidebar}
      </div>

      {/* Contenu principal */}
      <div className="min-h-screen lg:ml-[260px]">{children}</div>
    </>
  );
}

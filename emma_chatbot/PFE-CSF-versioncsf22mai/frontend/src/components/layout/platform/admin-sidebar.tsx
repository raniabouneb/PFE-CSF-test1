'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  BookOpen,
  Calendar,
  CheckSquare,
  LayoutDashboard,
  LogOut,
  Users,
} from 'lucide-react';
import { useState } from 'react';

import { useLogout } from '@/components/platform/auth/auth-user-context';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { href: '/admin', label: 'Tableau de bord', icon: LayoutDashboard },
  { href: '/admin/apprenants', label: 'Gestion des Apprenants', icon: Users },
  { href: '/admin/catalogue', label: 'Catalogue de Formation', icon: BookOpen },
  { href: '/admin/planning', label: 'Planning & Séances', icon: Calendar },
  {
    href: '/admin/validation',
    label: 'Centre de Validation & Documents',
    icon: CheckSquare,
  },
] as const;

const SIDEBAR_ASIDE_CLASS = cn(
  'fixed left-0 top-0 z-40 flex h-screen w-[260px] flex-col',
  'bg-gradient-to-b from-[#0D3570] to-[#0a2a55]',
  'border-r border-white/10',
  'shadow-[2px_0_20px_rgba(0,0,0,0.25)]',
);

function isNavActive(pathname: string, href: string) {
  if (href === '/admin') {
    return pathname === '/admin' || pathname === '/admin/';
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

function navLinkClass(active: boolean) {
  return cn(
    'flex items-center gap-3 rounded-lg py-2.5 text-sm transition-colors',
    active
      ? 'border-l-[3px] border-white bg-white/15 pl-[calc(0.75rem-3px)] pr-3 font-semibold text-white'
      : 'px-3 text-white/65 hover:bg-white/10',
  );
}

export default function AdminSidebar() {
  const pathname = usePathname();
  const [loggingOut, setLoggingOut] = useState(false);
  const logout = useLogout();

  async function handleLogout() {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await logout();
    } catch {
      setLoggingOut(false);
    }
  }

  return (
    <aside className={SIDEBAR_ASIDE_CLASS}>
      <div className="flex items-center justify-center px-4 pb-6 pt-8">
        <Link
          href="/"
          className="flex items-center justify-center rounded-2xl bg-white/10 p-4 transition-opacity hover:opacity-90"
        >
          <Image
            src="/images/logo-new.png"
            alt="CSF Formation"
            width={160}
            height={40}
            className="h-10 w-auto brightness-0 invert"
            priority
          />
        </Link>
      </div>

      <nav
        className="flex flex-1 flex-col gap-1 px-3 py-4"
        aria-label="Navigation administrateur"
      >
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = isNavActive(pathname, href);
          return (
            <Link
              key={href}
              href={href}
              className={navLinkClass(active)}
              aria-current={active ? 'page' : undefined}
            >
              <Icon
                className={cn('size-[18px] shrink-0', active ? 'text-white' : 'text-white/50')}
                aria-hidden
              />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-white/15 px-3 py-4">
        <button
          type="button"
          onClick={handleLogout}
          disabled={loggingOut}
          className={cn(
            'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
            'text-white/60 hover:bg-white/10 hover:text-white/90',
            'disabled:pointer-events-none disabled:opacity-60',
          )}
        >
          <LogOut className="size-[18px] shrink-0 text-white/60" aria-hidden />
          {loggingOut ? 'Déconnexion…' : 'Déconnexion'}
        </button>
      </div>
    </aside>
  );
}

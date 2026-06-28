'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Award, BookOpen, LayoutDashboard, LogOut, User } from 'lucide-react';
import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import { useLogout } from '@/components/platform/auth/auth-user-context';
import { cn } from '@/lib/utils';
import {
  learnerPlatformKeys,
  LEARNER_STALE_MS,
} from '@/lib/hooks/learner/use-learner-platform';
import { learnerGet } from '@/lib/api-client';
import type {
  LearnerCertificationsPayload,
  LearnerDashboardPayload,
  LearnerFormationsPayload,
} from '@/lib/server/learner-api';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Tableau de bord', icon: LayoutDashboard },
  { href: '/dashboard/formations', label: 'Mes Formations', icon: BookOpen },
  { href: '/dashboard/certifications', label: 'Mes Certifications', icon: Award },
  { href: '/dashboard/profile', label: 'Mon Profil', icon: User },
] as const;

const PREFETCH_BY_HREF: Record<string, readonly [typeof learnerPlatformKeys.dashboard, () => Promise<unknown>] | readonly [typeof learnerPlatformKeys.formations, () => Promise<unknown>] | readonly [typeof learnerPlatformKeys.certifications, () => Promise<unknown>]> = {
  '/dashboard': [learnerPlatformKeys.dashboard, () => learnerGet<LearnerDashboardPayload>('dashboard')],
  '/dashboard/formations': [learnerPlatformKeys.formations, () => learnerGet<LearnerFormationsPayload>('formations')],
  '/dashboard/certifications': [learnerPlatformKeys.certifications, () => learnerGet<LearnerCertificationsPayload>('certifications')],
  '/dashboard/profile': [learnerPlatformKeys.formations, () => learnerGet<LearnerFormationsPayload>('formations')],
};

const SIDEBAR_ASIDE_CLASS = cn(
  'fixed left-0 top-0 z-40 flex h-screen w-[260px] flex-col overflow-hidden',
  'bg-[#071939]',
  'border-r border-white/10',
  'shadow-[2px_0_20px_rgba(0,0,0,0.25)]',
  'rounded-r-2xl',
);

const SIDEBAR_GRADIENT_STYLE = {
  background: 'linear-gradient(to top, #05424a 0%, rgba(7, 25, 57, 0.5) 50%)',
} as const;


function isNavActive(pathname: string, href: string) {
  if (href === '/dashboard') {
    return pathname === '/dashboard' || pathname === '/dashboard/';
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

function SidebarLogo() {
  return (
    <div className="flex items-center justify-center px-2 pb-6 pt-8">
      <Link
        href="/"
        className="flex items-center justify-center rounded-4xl bg-white/10 pb-2 pt-1 pl-1 pr-1 transition-opacity hover:opacity-90"
      >
        <Image
          src="/images/logo-text-blanc.png"
          alt="CSF Formation"
          width={160}
          height={48}
          className="h-25 w-auto"
          priority
        />
      </Link>
    </div>
  );
}

function SidebarLogout({
  loggingOut,
  onLogout,
}: {
  loggingOut: boolean;
  onLogout: () => void;
}) {
  return (
    <div className="border-t border-white/15 px-3 py-4">
      <button
        type="button"
        onClick={onLogout}
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
  );
}

export default function PlatformSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const queryClient = useQueryClient();
  const logout = useLogout();
  const [loggingOut, setLoggingOut] = useState(false);

  function prefetchNav(href: string) {
    router.prefetch(href);
    const entry = PREFETCH_BY_HREF[href];
    if (!entry) return;
    const [key, fn] = entry;
    void queryClient.prefetchQuery({
      queryKey: key,
      queryFn: fn,
      staleTime: LEARNER_STALE_MS,
    });
    if (href === '/dashboard/profile') {
      void queryClient.prefetchQuery({
        queryKey: learnerPlatformKeys.certifications,
        queryFn: () => learnerGet<LearnerCertificationsPayload>('certifications'),
        staleTime: LEARNER_STALE_MS,
      });
    }
  }

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
      <div
        className="pointer-events-none absolute inset-0"
        style={SIDEBAR_GRADIENT_STYLE}
        aria-hidden
      />

      <div className="relative z-10 flex min-h-0 flex-1 flex-col">
        <SidebarLogo />

        <nav
          className="flex flex-1 flex-col gap-1 px-3 py-4"
          aria-label="Navigation apprenant"
        >
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const active = isNavActive(pathname, href);
            return (
              <Link
                key={href}
                href={href}
                prefetch
                onMouseEnter={() => prefetchNav(href)}
                onFocus={() => prefetchNav(href)}
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

        <SidebarLogout loggingOut={loggingOut} onLogout={handleLogout} />
      </div>
    </aside>
  );
}

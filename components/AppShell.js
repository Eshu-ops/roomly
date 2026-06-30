'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

const NAV = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/expenses', label: 'Expenses' },
  { href: '/meals', label: 'Meals' },
  { href: '/balances', label: 'Balances' },
  { href: '/analytics', label: 'Analytics' },
  { href: '/calendar', label: 'Calendar' },
  { href: '/notes', label: 'Notes' },
  { href: '/people', label: 'Roommates' },
  { href: '/reports', label: 'Reports' },
];

export default function AppShell({ house, children }) {
  const pathname = usePathname();
  const router = useRouter();
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const saved = window.localStorage?.getItem?.('roomly-theme');
    if (saved === 'dark') { document.documentElement.classList.add('dark'); setDark(true); }
  }, []);

  function toggleTheme() {
    document.documentElement.classList.toggle('dark');
    const isDark = document.documentElement.classList.contains('dark');
    setDark(isDark);
    window.localStorage?.setItem?.('roomly-theme', isDark ? 'dark' : 'light');
  }

  async function signOut() {
    await supabase.auth.signOut();
    router.push('/login');
  }

  return (
    <div className="flex min-h-screen">
      <nav className="w-[228px] shrink-0 bg-bg border-r border-line p-5 hidden md:flex flex-col gap-1 sticky top-0 h-screen overflow-y-auto">
        <div className="flex items-center gap-2 px-2 pb-6">
          <div className="w-7 h-7 rounded-lg bg-accent flex items-center justify-center text-white font-serif text-sm font-semibold">R</div>
          <span className="font-serif text-lg font-semibold">Roomly</span>
        </div>
        {NAV.map((n) => (
          <Link key={n.href} href={n.href}
            className={`text-sm font-medium px-3 py-2.5 rounded-lg ${pathname === n.href ? 'bg-accent/10 text-accent font-semibold' : 'text-ink/60 hover:bg-card'}`}>
            {n.label}
          </Link>
        ))}
        <div className="mt-auto pt-4 border-t border-line space-y-1">
          <div className="px-3 py-2 rounded-lg bg-card border border-line text-xs flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-accent" />
            {house?.name || 'Your house'}
          </div>
          <button onClick={toggleTheme} className="w-full text-left text-sm px-3 py-2 rounded-lg text-ink/60 hover:bg-card">
            {dark ? 'Light mode' : 'Dark mode'}
          </button>
          <button onClick={signOut} className="w-full text-left text-sm px-3 py-2 rounded-lg text-ink/60 hover:bg-card">
            Sign out
          </button>
        </div>
      </nav>
      <main className="flex-1 min-w-0 p-5 md:p-10 max-w-[1180px]">{children}</main>
    </div>
  );
}

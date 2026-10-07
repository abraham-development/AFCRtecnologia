'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronDown, LoaderCircle, LogOut, Package, ShieldCheck, UserRound } from 'lucide-react';
import { useEffect, useId, useRef, useState } from 'react';

import { headerCopy } from '@/content/agency';
import { authCopy } from '@/content/auth';
import { useAuthUser } from '@/hooks/useAuthUser';
import { getAuthClient } from '@/lib/auth/client';
import { cn } from '@/lib/utils';

const BUTTON =
  'inline-flex h-11 items-center justify-center border px-2.5 text-[0.75rem] font-medium whitespace-nowrap transition-colors min-[380px]:px-3 min-[380px]:text-[0.8125rem] sm:px-3.5 disabled:cursor-wait disabled:opacity-60';
const SURFACE = 'border-border-editorial bg-bg-darkest/80 text-text-primary hover:border-accent-cyan hover:text-accent-cyan';
const links = [
  { href: '/cuenta#perfil', label: authCopy.navigation.profile, icon: UserRound },
  { href: '/cuenta/pedidos', label: authCopy.navigation.orders, icon: Package },
  { href: '/cuenta#seguridad', label: authCopy.navigation.security, icon: ShieldCheck },
];

interface AccountActionsProps {
  className?: string;
  onNavigate?: () => void;
  placement?: 'above' | 'below';
}

/** La sesión cambia las acciones del topbar y del menú sin alterar el carrito. */
export function AccountActions({ className, onNavigate, placement = 'below' }: AccountActionsProps) {
  const { user, loading } = useAuthUser();
  const [logoutFailed, setLogoutFailed] = useState(false);
  const pathname = usePathname();
  useEffect(() => { if (user) queueMicrotask(() => setLogoutFailed(false)); }, [user]);
  if (loading) return <div role="status" className={cn('flex h-11 min-w-0 items-center gap-2 text-xs text-text-secondary', className)}><LoaderCircle size={15} aria-hidden="true" className="shrink-0 animate-spin motion-reduce:animate-none"/>{authCopy.account.loading}</div>;
  if (user) return <SignedInActions key={`${user.id}:${pathname}`} email={user.email ?? authCopy.navigation.fallback} className={className} onNavigate={onNavigate} placement={placement} onStart={() => setLogoutFailed(false)} onFailure={() => setLogoutFailed(true)}/>;
  return (
    <div className={cn('relative flex min-w-0 items-center justify-end gap-2', className)}>
      <Link href={headerCopy.signInHref} data-cursor="expand" aria-current={pathname === headerCopy.signInHref ? 'page' : undefined} onClick={onNavigate} className={cn(BUTTON, SURFACE, 'shrink-0', pathname === headerCopy.signInHref && 'border-accent-cyan')}>
        {headerCopy.signIn}
      </Link>
      {logoutFailed ? <p role="alert" className={cn('absolute right-0 z-10 w-full border border-amber-400/40 bg-bg-darkest p-4 text-sm leading-relaxed text-amber-200 sm:w-80', placement === 'above' ? 'bottom-full mb-2' : 'top-full mt-2')}>{authCopy.navigation.localSignOut}</p> : null}
      <Link href={headerCopy.signUpHref} data-cursor="expand" aria-current={pathname === headerCopy.signUpHref ? 'page' : undefined} onClick={onNavigate} className={cn(BUTTON, 'shrink-0 border-accent-cyan/70 bg-bg-darkest/80 text-text-primary hover:border-accent-cyan hover:bg-accent-cyan hover:text-bg-darkest focus-visible:bg-accent-cyan focus-visible:text-bg-darkest')}>
        {headerCopy.signUp}
      </Link>
    </div>
  );
}

function SignedInActions({ email, className, onNavigate, placement, onStart, onFailure }: AccountActionsProps & { email: string; onStart: () => void; onFailure: () => void }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const id = useId();
  const root = useRef<HTMLDivElement>(null);
  const toggle = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLElement>(null);
  useEffect(() => {
    if (!open && !error) return;
    function outside(event: PointerEvent) {
      if (!root.current?.contains(event.target as Node)) { setOpen(false); setError(''); }
    }
    document.addEventListener('pointerdown', outside);
    return () => document.removeEventListener('pointerdown', outside);
  }, [open, error]);
  async function signOut() {
    if (busy) return;
    onStart();
    setBusy(true); setError(''); setOpen(false);
    try {
      const { error: issue } = await getAuthClient().auth.signOut({ scope: 'local' });
      if (issue) throw issue;
      onNavigate?.();
    } catch {
      onFailure();
      setError(authCopy.navigation.signOutError); setBusy(false);
    }
  }
  return (
    <div ref={root} className={cn('relative flex w-full min-w-0 items-center gap-2 sm:w-auto sm:max-w-[min(29rem,45vw)]', className)} onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false); }} onKeyDown={event => {
      if (event.key === 'Escape' && open) { event.preventDefault(); event.stopPropagation(); setOpen(false); toggle.current?.focus(); }
    }}>
      <button ref={toggle} type="button" disabled={busy} data-cursor="expand" aria-expanded={open} aria-controls={id} title={`${authCopy.navigation.hello} ${email}`} onClick={() => { setError(''); setOpen(value => !value); }} onKeyDown={event => {
        if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
          event.preventDefault(); setOpen(true);
          requestAnimationFrame(() => { const items = panel.current?.querySelectorAll<HTMLAnchorElement>('a'); (event.key === 'ArrowDown' ? items?.[0] : items?.[items.length - 1])?.focus(); });
        }
      }} className={cn(BUTTON, SURFACE, 'min-w-0 flex-1 gap-2 border-accent-cyan/70', open && 'border-accent-cyan bg-bg-darkest')}>
        <span className="shrink-0">{authCopy.navigation.hello}</span><span className="min-w-0 truncate">{email}</span><ChevronDown size={15} aria-hidden="true" className={cn('shrink-0 transition-transform motion-reduce:transition-none', open && 'rotate-180')}/>
      </button>
      <button type="button" disabled={busy} onClick={signOut} data-cursor="expand" className={cn(BUTTON, SURFACE, 'shrink-0 gap-2')}><LogOut size={15} aria-hidden="true" className="hidden min-[380px]:block"/>{busy ? authCopy.navigation.signingOut : authCopy.account.signOut}</button>
      {open ? <nav ref={panel} id={id} aria-label={authCopy.navigation.menu} className={cn('absolute right-0 z-10 w-full border border-border-editorial bg-bg-darkest p-2 sm:w-80', placement === 'above' ? 'bottom-full mb-2' : 'top-full mt-2')}>
        <p className="border-b border-border-editorial px-3 py-3 text-sm leading-relaxed break-all text-text-secondary">{email}</p>
        {links.map(({ href, label, icon: Icon }) => <Link key={href} href={href} onClick={() => { setOpen(false); onNavigate?.(); }} data-cursor="expand" className="flex min-h-12 items-center gap-3 px-3 py-3 text-sm text-text-primary transition-colors hover:bg-bg-secondary hover:text-accent-cyan focus-visible:bg-bg-secondary"><Icon size={18} aria-hidden="true" className="shrink-0 text-accent-cyan"/>{label}</Link>)}
      </nav> : null}
      {error ? <p role="alert" className={cn('absolute right-0 z-10 w-full border border-red-400/40 bg-bg-darkest p-4 text-sm leading-relaxed text-red-300 sm:w-80', placement === 'above' ? 'bottom-full mb-2' : 'top-full mt-2')}>{error}</p> : null}
    </div>
  );
}

export default AccountActions;

'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { checkoutCopy } from '@/content/store';
import { authCopy } from '@/content/auth';
import { useAuthUser } from '@/hooks/useAuthUser';
import { getAuthClient } from '@/lib/auth/client';
import { authErrorMessage } from '@/lib/auth/errors';
import { MethodChange } from './MethodChange';
import { AdminLink } from '@/components/admin/AdminLink';

export function AccountPanel() {
  const { user, loading } = useAuthUser();
  const router = useRouter();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (!loading && !user) router.replace('/iniciar-sesion');
  }, [loading, user, router]);
  async function signOut() {
    setBusy(true); setError('');
    try {
      const { error: issue } = await getAuthClient().auth.signOut();
      if (issue) throw issue;
      router.replace('/iniciar-sesion');
    } catch (issue) { setError(authErrorMessage(issue)); setBusy(false); }
  }
  if (loading || !user) return <p role="status" className="text-text-secondary">{authCopy.account.loading}</p>;
  return <div>
    <dl className="divide-border-editorial divide-y">
      <div className="pb-6"><dt className="text-text-secondary text-sm">{authCopy.account.email}</dt><dd className="mt-2 text-lg break-all">{user.email}</dd></div>
    </dl>
    <MethodChange email={user.email ?? ''} userId={user.id}/>
    <AdminLink userId={user.id}/>
    {error ? <p role="alert" className="mb-6 text-sm leading-relaxed text-red-300">{error}</p> : null}
    <Link href="/cuenta/pedidos" className="text-accent-cyan mt-5 inline-flex min-h-12 items-center underline-offset-4 hover:underline">{checkoutCopy.orders}</Link>
    <Link href="/tienda" className="border-border-editorial hover:border-accent-cyan mt-6 flex min-h-12 w-full items-center justify-center border px-4 py-3 text-base transition-colors">{authCopy.account.store}</Link>
    <button type="button" disabled={busy} onClick={signOut} className="text-text-secondary hover:text-text-primary mt-4 min-h-11 w-full text-sm underline-offset-4 hover:underline disabled:opacity-60">{busy ? authCopy.working : authCopy.account.signOut}</button>
  </div>;
}

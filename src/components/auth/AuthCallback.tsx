'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { authCopy } from '@/content/auth';
import { getAuthClient } from '@/lib/auth/client';
import { authErrorMessage } from '@/lib/auth/errors';

/** React StrictMode no debe canjear dos veces el mismo código PKCE. */
let exchange: { code: string; promise: ReturnType<ReturnType<typeof getAuthClient>['auth']['exchangeCodeForSession']> } | undefined;

export function AuthCallback() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [changingMethod, setChangingMethod] = useState(false);
  useEffect(() => {
    let mounted = true;
    async function finish() {
      try {
        const params = new URLSearchParams(window.location.search);
        if (sessionStorage.getItem('afcr-method-change') && mounted) setChangingMethod(true);
        if (params.has('error')) throw { message: params.get('error_description') ?? '' };
        const code = params.get('code');
        if (!code) throw new Error('MISSING_AUTH_CODE');
        if (exchange?.code !== code) exchange = { code, promise: getAuthClient().auth.exchangeCodeForSession(code) };
        const { data, error: authError } = await exchange.promise;
        if (authError) throw authError;
        const changing = sessionStorage.getItem('afcr-method-change');
        if (changing && data.user?.id !== changing) {
          await getAuthClient().auth.signOut({scope:'local'});
          throw new Error('AFCR_WRONG_GOOGLE');
        }
        if (changing) await getAuthClient().auth.signOut({scope:'others'});
        if (mounted) { window.history.replaceState(null, '', '/auth/callback'); const next = sessionStorage.getItem('afcr-auth-next'); sessionStorage.removeItem('afcr-auth-next'); router.replace(changing ? '/cuenta' : next === '/checkout' || next === '/admin' ? next : '/cuenta'); }
      } catch (issue) {
        if (mounted) { window.history.replaceState(null, '', '/auth/callback'); setError(authErrorMessage(issue)); }
      }
    }
    void finish();
    return () => { mounted = false; };
  }, [router]);
  return <div>
    <p role={error ? 'alert' : 'status'} className={error ? 'text-red-300 leading-relaxed' : 'text-text-secondary'}>{error || authCopy.account.loading}</p>
    {error ? <Link href={changingMethod ? '/cuenta' : '/iniciar-sesion'} className="text-accent-cyan mt-6 inline-flex min-h-11 items-center underline-offset-4 hover:underline">{changingMethod ? authCopy.methodChange.back : authCopy.recovery.link}</Link> : null}
  </div>;
}

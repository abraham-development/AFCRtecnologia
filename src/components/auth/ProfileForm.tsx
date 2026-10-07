'use client';

import type { User } from '@supabase/supabase-js';
import { useEffect, useState, type FormEvent } from 'react';
import { authCopy } from '@/content/auth';
import { getAuthClient } from '@/lib/auth/client';
import { authErrorMessage } from '@/lib/auth/errors';
import { Button, Field, Input, Toast } from '@/components/store/StoreUI';

type Details = { names: string; surnames: string; mobile: string };
const copy = authCopy.profile;
function initialDetails(user: User): Details {
  const value = (key: string) => typeof user.user_metadata[key] === 'string' ? user.user_metadata[key].slice(0, 100) : '';
  return { names: value('names'), surnames: value('surnames'), mobile: value('mobile') };
}

/** Datos personales; los permisos y la revisión de sesión permanecen en RLS. */
export function ProfileForm({ user }: { user: User }) {
  const [details, setDetails] = useState<Details>(() => initialDetails(user));
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [hasProfile, setHasProfile] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  useEffect(() => {
    let active = true;
    Promise.resolve(getAuthClient().from('profiles').select('names,surnames,mobile').eq('user_id', user.id).maybeSingle()).then(({ data, error: issue }) => {
      if (!active) return;
      if (issue) { setState('error'); return; }
      setHasProfile(Boolean(data));
      if (data) setDetails({ names: data.names, surnames: data.surnames, mobile: data.mobile });
      setState('ready');
    }).catch(() => { if (active) setState('error'); });
    return () => { active = false; };
  }, [user.id, attempt]);
  const valid = Boolean(details.names.trim() && details.surnames.trim() && /^9[0-9]{8}$/.test(details.mobile));
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || state !== 'ready') return;
    if (!valid) { setError(copy.invalid); return; }
    setBusy(true); setError(''); setNotice('');
    const values = { names: details.names.trim(), surnames: details.surnames.trim(), mobile: details.mobile };
    try {
      const client = getAuthClient();
      const { error: issue } = await client.auth.updateUser({ data: values });
      if (issue) throw issue;
      if (hasProfile) {
        const { data, error: profileIssue } = await client.from('profiles').update(values).eq('user_id', user.id).select('user_id').maybeSingle();
        if (profileIssue || !data) { setError(copy.partial); return; }
      }
      setDetails(values); setNotice(copy.saved);
    } catch (issue) { setError(authErrorMessage(issue)); }
    finally { setBusy(false); }
  }
  function change(key: keyof Details, value: string) {
    setDetails(current => ({ ...current, [key]: value })); setNotice(''); setError('');
  }
  return <section id="perfil" tabIndex={-1} aria-labelledby="profile-title" className="scroll-mt-40">
    <h2 id="profile-title" className="text-2xl font-medium tracking-[-0.02em]">{copy.title}</h2>
    <p className="mt-3 text-sm leading-relaxed text-text-secondary">{copy.hint}</p>
    <dl className="my-6 border-y border-border-editorial py-5"><dt className="text-sm text-text-secondary">{authCopy.account.email}</dt><dd className="mt-2 break-all text-base">{user.email}</dd></dl>
    <p className="mb-6 text-sm leading-relaxed text-text-secondary">{copy.emailHint}</p>
    {state === 'loading' ? <p role="status" className="py-5 text-sm text-text-secondary">{authCopy.account.loading}</p> : state === 'error' ? <div className="space-y-4"><Toast message={copy.loadError} error/><Button variant="secondary" type="button" className="w-full" onClick={() => { setState('loading'); setAttempt(value => value + 1); }}>{copy.retry}</Button></div> :
    <form onSubmit={save} className="space-y-5">
      <fieldset disabled={busy} className="space-y-5 disabled:opacity-70">
        <Field id="profile-names" label={copy.names}><Input id="profile-names" autoComplete="given-name" maxLength={100} required value={details.names} onChange={event => change('names', event.target.value)}/></Field>
        <Field id="profile-surnames" label={copy.surnames}><Input id="profile-surnames" autoComplete="family-name" maxLength={100} required value={details.surnames} onChange={event => change('surnames', event.target.value)}/></Field>
        <Field id="profile-mobile" label={copy.mobile}><Input id="profile-mobile" type="tel" inputMode="numeric" autoComplete="tel-national" maxLength={9} pattern="9[0-9]{8}" required aria-describedby="profile-mobile-hint" value={details.mobile} onChange={event => change('mobile', event.target.value.replace(/[^0-9]/g, ''))}/></Field>
        <p id="profile-mobile-hint" className="text-sm leading-relaxed text-text-secondary">{copy.mobileHint}</p>
      </fieldset>
      <Toast message={error} error/><Toast message={notice}/>
      <Button type="submit" disabled={busy || !valid} className="w-full">{busy ? copy.saving : copy.save}</Button>
    </form>}
  </section>;
}

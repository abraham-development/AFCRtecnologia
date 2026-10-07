'use client';

import Link from 'next/link';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { authCopy } from '@/content/auth';
import { getAuthClient } from '@/lib/auth/client';
import { authErrorMessage } from '@/lib/auth/errors';
import { authMethodOperation, type AuthMethod, type MethodStatus } from '@/lib/auth/method';
import { otpSchema, passwordSchema } from '@/lib/auth/validation';
import { AUTH_BUTTON } from './AuthForm';
import { AUTH_INPUT, PasswordField } from './PasswordField';

export function MethodChange({ email, userId }: { email: string; userId: string }) {
  const [method, setMethod] = useState<AuthMethod>();
  const [target, setTarget] = useState<AuthMethod>();
  const [challenge, setChallenge] = useState('');
  const [ready, setReady] = useState(false);
  const [complete, setComplete] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [fields, setFields] = useState<Record<string, string>>({});
  const [cooldown, setCooldown] = useState(0);
  const heading = useRef<HTMLHeadingElement>(null);
  const copy = authCopy.methodChange;
  useEffect(() => {
    let mounted = true;
    authMethodOperation<MethodStatus>({ action:'status' }).then(state => {
      if (!mounted) return;
      setMethod(state.method);
      if (state.pending) { setTarget(state.pending.target); setChallenge(state.pending.id); setReady(state.pending.verified && state.pending.target==='google'); }
      if (sessionStorage.getItem('afcr-method-change') === userId) {
        sessionStorage.removeItem('afcr-method-change');
        if (state.method === 'google') setNotice(copy.googleComplete);
      }
    }).catch(issue => { if (mounted) setError(authErrorMessage(issue)); });
    return () => { mounted = false; };
  }, [userId, copy.googleComplete]);
  useEffect(() => {
    if (!challenge && !complete) return;
    heading.current?.focus({ preventScroll:true });
    heading.current?.scrollIntoView({ block:'center' });
  }, [challenge, ready, complete]);
  useEffect(() => {
    if (!cooldown) return;
    const timer = setTimeout(() => setCooldown(value => Math.max(0,value-1)),1000);
    return () => clearTimeout(timer);
  }, [cooldown]);
  async function sendCode() {
    if (!target || busy || cooldown) return;
    setBusy(true); setError(''); setFields({});
    try {
      const result = await authMethodOperation<{id:string}>({action:'request',target});
      setChallenge(result.id); setReady(false); setNotice(copy.sent); setCooldown(60);
    } catch (issue) { setError(authErrorMessage(issue)); }
    finally { setBusy(false); }
  }
  async function cancel() {
    if (busy) return;
    setBusy(true); setError('');
    try {
      if (challenge) await authMethodOperation({action:'cancel',id:challenge});
      setTarget(undefined); setChallenge(''); setReady(false); setFields({}); setNotice('');
      sessionStorage.removeItem('afcr-method-change');
    } catch (issue) { setError(authErrorMessage(issue)); }
    finally { setBusy(false); }
  }
  async function google() {
    setBusy(true); setError('');
    try {
      sessionStorage.setItem('afcr-method-change',userId);
      const client = getAuthClient();
      const identities = await client.auth.getUserIdentities();
      if (identities.error) throw identities.error;
      const linked = identities.data.identities.some(identity => identity.provider==='google' && identity.identity_data?.email?.toLowerCase()===email.toLowerCase());
      const options = {redirectTo:`${window.location.origin}/auth/callback`,queryParams:{login_hint:email,prompt:'select_account'}};
      const { error:issue } = linked
        ? await client.auth.signInWithOAuth({provider:'google',options})
        : await client.auth.linkIdentity({provider:'google',options});
      if (issue) throw issue;
    } catch (issue) { setError(authErrorMessage(issue)); setBusy(false); }
  }
  async function verify(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const values = new FormData(event.currentTarget);
    const token = String(values.get('method-otp') ?? '').replace(/\s/g,'');
    const password = String(values.get('method-password') ?? '');
    const errors: Record<string,string> = {};
    if (!otpSchema.safeParse(token).success) errors.otp=authCopy.errors.otp;
    if (target==='password') {
      if (!passwordSchema.safeParse(password).success) errors.password=authCopy.errors.password;
      if (password!==values.get('method-confirm')) errors.confirm=authCopy.errors.mismatch;
    }
    setFields(errors); setError('');
    if (Object.keys(errors).length) return;
    setBusy(true);
    try {
      await authMethodOperation({action:target==='google'?'verify_google':'complete_password',id:challenge,token,...(target==='password'?{password}:{})});
      setNotice('');
      if (target==='google') setReady(true);
      else {
        sessionStorage.setItem('afcr-password-changed','1');
        setComplete(true);
        await getAuthClient().auth.signOut({scope:'local'});
      }
    } catch (issue) { setError(authErrorMessage(issue)); }
    finally { setBusy(false); }
  }
  return <section className="border-border-editorial mt-8 border-t pt-8" aria-labelledby="method-heading">
    <h2 id="method-heading" ref={heading} tabIndex={-1} className="font-display text-2xl outline-none">{copy.title}</h2>
    {complete ? <><p role="status" className="text-text-secondary mt-4 leading-relaxed">{copy.passwordComplete}</p><Link href="/iniciar-sesion" className={`${AUTH_BUTTON} mt-6`}>{authCopy.recovery.link}</Link></> : <>
      <p className="text-text-secondary mt-3 text-sm leading-relaxed">{copy.intro}</p>
      {method ? <dl className="mt-6"><dt className="text-text-secondary text-sm">{authCopy.account.method}</dt><dd className="mt-1 text-lg">{method==='google'?authCopy.account.google:authCopy.account.password}</dd></dl> : !error ? <p role="status" className="text-text-secondary mt-4">{authCopy.account.loading}</p> : null}
      {error && (!challenge || ready) ? <p role="alert" className="mt-4 text-sm leading-relaxed text-red-300">{error}</p> : null}
      {error && !method ? <Link href="/iniciar-sesion" className="text-accent-cyan mt-3 inline-flex min-h-11 items-center text-sm underline underline-offset-4">{authCopy.recovery.link}</Link> : null}
      {notice && !error ? <p role="status" className="text-accent-cyan mt-4 text-sm leading-relaxed">{notice}</p> : null}
      {!target && method ? <button type="button" onClick={()=>{setTarget(method==='google'?'password':'google');setNotice('');}} className="text-accent-cyan mt-4 min-h-12 text-left text-sm underline underline-offset-4">{method==='google'?copy.toPassword:copy.toGoogle}</button> : null}
      {target ? <div className="mt-6">
        <p className="text-text-secondary text-sm leading-relaxed">{target==='google'?copy.googleWarning:copy.passwordWarning}</p>
        {!challenge ? <button type="button" disabled={busy || cooldown>0} onClick={sendCode} className={`${AUTH_BUTTON} mt-5`}>{busy?authCopy.working:cooldown?authCopy.wait(cooldown):copy.send}</button> : ready ? <>
          <p className="mt-4 text-sm leading-relaxed">{copy.googleReady}</p>
          <button type="button" disabled={busy} onClick={google} className={`${AUTH_BUTTON} mt-5`}>{busy?authCopy.working:copy.continueGoogle}</button>
        </> : <form onSubmit={verify} noValidate className="mt-5 space-y-5">
          <div><label htmlFor="method-otp" className="mb-2 block text-sm font-medium">{authCopy.otp}</label><input id="method-otp" name="method-otp" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} required disabled={busy} aria-invalid={Boolean(fields.otp)} aria-describedby={fields.otp?'method-otp-error':'method-otp-hint'} className={`${AUTH_INPUT} font-mono text-xl tracking-[0.3em]`}/><p id="method-otp-hint" className="text-text-secondary mt-2 text-sm leading-relaxed">{authCopy.verify.hint}</p>{fields.otp?<p id="method-otp-error" className="mt-2 text-sm text-red-300">{fields.otp}</p>:null}</div>
          {target==='password'?<><PasswordField id="method-password" label={authCopy.newPasswordLabel} autoComplete="new-password" hint error={fields.password} disabled={busy}/><PasswordField id="method-confirm" label={authCopy.confirmPassword} autoComplete="new-password" error={fields.confirm} disabled={busy}/></>:null}
          {error ? <p role="alert" className="text-sm leading-relaxed text-red-300">{error}</p> : null}
          <button disabled={busy} className={AUTH_BUTTON}>{busy?authCopy.working:target==='google'?copy.verifyGoogle:copy.completePassword}</button>
          <button type="button" disabled={busy || cooldown>0} onClick={sendCode} className="text-accent-cyan min-h-11 w-full text-sm underline-offset-4 hover:underline disabled:text-text-secondary">{cooldown?authCopy.wait(cooldown):authCopy.verify.resend}</button>
        </form>}
        <button type="button" onClick={cancel} disabled={busy} className="text-text-secondary mt-3 min-h-11 w-full text-sm underline-offset-4 hover:underline">{copy.cancel}</button>
      </div>:null}
    </>}
  </section>;
}

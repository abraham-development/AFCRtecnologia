'use client';

import { ArrowRight, LoaderCircle } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import type { User } from '@supabase/supabase-js';
import { checkoutCopy } from '@/content/store';
import { authCopy } from '@/content/auth';
import { getAuthClient } from '@/lib/auth/client';
import { authErrorMessage } from '@/lib/auth/errors';
import { emailSchema, normalizeEmail, otpSchema, passwordSchema } from '@/lib/auth/validation';
import { AUTH_INPUT, PasswordField } from './PasswordField';

type Mode = 'signUp' | 'signIn' | 'recovery' | 'confirmation';
type Step = 'credentials' | 'verify' | 'password' | 'complete';
export const AUTH_BUTTON = 'bg-accent-cyan text-bg-darkest hover:bg-accent-cyan/90 flex min-h-12 w-full items-center justify-center gap-3 px-4 py-3 text-base font-medium transition-colors disabled:cursor-wait disabled:opacity-60';

function GoogleMark() {
  return <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M21.8 12.2c0-.7-.1-1.4-.2-2.1H12v4h5.5a4.7 4.7 0 0 1-2 3.1v2.6h3.2c1.9-1.8 3.1-4.4 3.1-7.6Z"/><path fill="#34A853" d="M12 22c2.7 0 5-.9 6.7-2.2l-3.2-2.6c-.9.6-2.1.9-3.5.9a6 6 0 0 1-5.6-4.1H3.1v2.7A10 10 0 0 0 12 22Z"/><path fill="#FBBC05" d="M6.4 14a6 6 0 0 1 0-4V7.3H3.1a10 10 0 0 0 0 9.4L6.4 14Z"/><path fill="#EA4335" d="M12 5.9c1.5 0 2.9.5 3.9 1.5l2.9-2.9A10 10 0 0 0 3.1 7.3L6.4 10A6 6 0 0 1 12 5.9Z"/></svg>;
}

export function AuthForm({ mode, onSuccess, checkout = false, returnTo }: { mode: Mode; onSuccess?: (user:User)=>void; checkout?:boolean; returnTo?:'/admin' }) {
  const router = useRouter();
  const [step, setStep] = useState<Step>('credentials');
  const [email, setEmail] = useState('');
  const [next, setNext] = useState(returnTo??(checkout ? '/checkout' : '/cuenta'));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [cooldown, setCooldown] = useState(0);
  const [verificationType, setVerificationType] = useState<'signup' | 'recovery'>('signup');
  const stepHeading = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    const target = new URLSearchParams(window.location.search).get('next');
    const pending = sessionStorage.getItem('afcr-pending-email') ?? '';
    queueMicrotask(() => {
      if (target === '/checkout' || target === '/admin') setNext(target);
      if (mode === 'confirmation' && pending) { setEmail(pending); setStep('verify'); }
    });
  }, [mode]);
  function succeed(user:User) {
    sessionStorage.removeItem('afcr-pending-email');
    if (onSuccess) onSuccess(user); else router.replace(next);
  }
  useEffect(() => {
    if (mode !== 'signIn' || !sessionStorage.getItem('afcr-password-changed')) return;
    sessionStorage.removeItem('afcr-password-changed');
    queueMicrotask(() => setNotice(authCopy.methodChange.passwordComplete));
  }, [mode]);

  useEffect(() => {
    if (step === 'credentials') return;
    stepHeading.current?.focus({ preventScroll: true });
    stepHeading.current?.scrollIntoView({ block: 'center' });
  }, [step]);
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = window.setTimeout(() => setCooldown(value => Math.max(0, value - 1)), 1000);
    return () => window.clearTimeout(timer);
  }, [cooldown]);

  function showVerification(type: 'signup' | 'recovery') {
    setVerificationType(type);
    setStep('verify');
    setCooldown(60);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const form = event.currentTarget;
    const values = new FormData(form);
    const nextEmail = normalizeEmail(String(values.get('email') ?? email));
    const password = String(values.get('password') ?? '');
    const names = String(values.get('names') ?? '').trim();
    const surnames = String(values.get('surnames') ?? '').trim();
    const confirmPassword = String(values.get('confirm-password') ?? '');
    const errors: Record<string, string> = {};
    if (step === 'credentials' && !emailSchema.safeParse(nextEmail).success) errors.email = authCopy.errors.email;
    if ((mode === 'signUp' && step === 'credentials') || step === 'password') {
      if (!passwordSchema.safeParse(password).success) errors.password = authCopy.errors.password;
      if (password !== confirmPassword) errors['confirm-password'] = authCopy.errors.mismatch;
    } else if (mode === 'signIn' && step === 'credentials' && !password) errors.password = authCopy.errors.passwordRequired;
    const token = String(values.get('otp') ?? '').replace(/\s/g, '');
    if (step === 'verify' && !otpSchema.safeParse(token).success) errors.otp = authCopy.errors.otp;
    if (checkout && mode === 'signUp' && step === 'credentials') { if(!names) errors.names = checkoutCopy.nameRequired; if(!surnames) errors.surnames = checkoutCopy.nameRequired; }
    setFieldErrors(errors);
    setError('');
    setNotice('');
    if (Object.keys(errors).length) { form.querySelector<HTMLInputElement>(`[name="${Object.keys(errors)[0]}"]`)?.focus(); return; }
    setBusy(true);
    try {
      const client = getAuthClient();
      if (step === 'verify') {
        const { data, error: authError } = await client.auth.verifyOtp({ email, token, type: verificationType });
        if (authError) throw authError;
        if (verificationType === 'recovery') { setStep('password'); }
        else if (data.user) { succeed(data.user); }
      } else if (step === 'password') {
        const { error: authError } = await client.auth.updateUser({ password });
        if (authError) throw authError;
        const { error: logoutError } = await client.auth.signOut({ scope: 'global' });
        if (logoutError) throw logoutError;
        form.reset();
        setStep('complete');
        setNotice(authCopy.passwordUpdated);
      } else if (mode === 'signUp') {
        setEmail(nextEmail);
        const { data, error: authError } = await client.auth.signUp({ email: nextEmail, password, ...(checkout ? {options:{data:{names,surnames}}} : {}) });
        if (authError) throw authError;
        form.reset();
        if (data.session) {
          if (data.user) succeed(data.user);
          return;
        }
        sessionStorage.setItem('afcr-pending-email',nextEmail);
        if(checkout) router.push('/verificar?next=/checkout'); else showVerification('signup');
      } else if (mode === 'confirmation') {
        setEmail(nextEmail); showVerification('signup'); setCooldown(0);
      } else if (mode === 'recovery') {
        setEmail(nextEmail);
        const { error: authError } = await client.auth.resetPasswordForEmail(nextEmail);
        if (authError) throw authError;
        showVerification('recovery');
        setNotice(authCopy.recoverySent);
      } else {
        setEmail(nextEmail);
        const { data, error: authError } = await client.auth.signInWithPassword({ email: nextEmail, password });
        if (authError?.code === 'email_not_confirmed') { sessionStorage.setItem('afcr-pending-email',nextEmail); if(checkout) router.push('/verificar?next=/checkout'); else { showVerification('signup'); setCooldown(0); setNotice(authCopy.unconfirmed); } }
        else if (authError) throw authError;
        else if(data.user) { form.reset(); succeed(data.user); }
      }
    } catch (issue) { setError(authErrorMessage(issue)); }
    finally { setBusy(false); }
  }

  async function resend() {
    if (busy || cooldown) return;
    setBusy(true); setError(''); setNotice('');
    try {
      const client = getAuthClient();
      const result = verificationType === 'recovery'
        ? await client.auth.resetPasswordForEmail(email)
        : await client.auth.resend({ type: 'signup', email });
      if (result.error) throw result.error;
      setCooldown(60); setNotice(authCopy.resent);
    } catch (issue) { setError(authErrorMessage(issue)); }
    finally { setBusy(false); }
  }

  async function google() {
    if (busy) return;
    setBusy(true); setError('');
    try {
      sessionStorage.setItem('afcr-auth-next',next);
      const { error: authError } = await getAuthClient().auth.signInWithOAuth({ provider: 'google', options: { redirectTo: `${window.location.origin}/auth/callback`, scopes: 'email profile' } });
      if (authError) throw authError;
    } catch (issue) { setError(authErrorMessage(issue)); setBusy(false); }
  }

  const submitClass = checkout ? AUTH_BUTTON.replace('bg-accent-cyan text-bg-darkest hover:bg-accent-cyan/90','bg-[#2563EB] text-white hover:bg-blue-700') : AUTH_BUTTON;
  const copy = mode === 'confirmation' ? { action:authCopy.verify.action,alternate:authCopy.signIn.alternate,link:authCopy.signIn.link } : authCopy[mode];
  if (step === 'complete') return <div>
    <h2 ref={stepHeading} tabIndex={-1} className="text-2xl font-medium tracking-[-0.02em]">{authCopy.newPassword.complete}</h2>
    <p role="status" className="text-text-secondary mt-3 leading-relaxed">{authCopy.passwordUpdated}</p>
    <Link href={next === '/checkout' || next === '/admin' ? next : '/iniciar-sesion'} className={`${AUTH_BUTTON} mt-7`}>{authCopy.signIn.action}<ArrowRight size={18} aria-hidden="true" /></Link>
  </div>;
  return (
    <div>
      {step === 'credentials' && mode !== 'recovery' && mode !== 'confirmation' ? <>
        <button type="button" onClick={google} disabled={busy} className="border-border-editorial hover:border-accent-cyan flex min-h-12 w-full items-center justify-center gap-3 border px-4 py-3 text-base font-medium transition-colors disabled:opacity-60"><GoogleMark />{authCopy.google}</button>
        <div className="text-text-secondary my-7 flex items-center gap-4 text-sm"><span className="bg-border-editorial h-px flex-1" />{authCopy.or}<span className="bg-border-editorial h-px flex-1" /></div>
      </> : null}
      {step !== 'credentials' ? <div className="mb-7">
        <h2 ref={stepHeading} tabIndex={-1} className="text-2xl font-medium tracking-[-0.02em]">{step === 'verify' ? authCopy.verify.title : authCopy.newPassword.title}</h2>
        <p className="text-text-secondary mt-3 leading-relaxed">{step === 'verify' ? <>{authCopy.verify.lede} <strong className="text-text-primary font-medium break-all">{email}</strong>.</> : authCopy.newPassword.lede}</p>
      </div> : null}
      <form onSubmit={submit} noValidate className="space-y-6">
        <fieldset disabled={busy} className="space-y-6">
          {checkout && mode === 'signUp' && step === 'credentials' ? <div className="grid gap-5 sm:grid-cols-2">{(['names','surnames'] as const).map(name=><div key={name}><label htmlFor={name} className="mb-2 block text-sm font-medium">{checkoutCopy[name]}</label><input id={name} name={name} autoComplete={name==='names'?'given-name':'family-name'} required maxLength={100} className={AUTH_INPUT} aria-invalid={Boolean(fieldErrors[name])}/>{fieldErrors[name]?<p className="mt-2 text-sm text-red-300">{fieldErrors[name]}</p>:null}</div>)}</div> : null}
          {step === 'credentials' ? <div>
            <label htmlFor="email" className="mb-2 block text-sm font-medium">{authCopy.email}</label>
            <input id="email" name="email" type="email" autoComplete="email" autoCapitalize="none" spellCheck={false} required maxLength={254} defaultValue={email} placeholder={authCopy.emailPlaceholder}
              aria-invalid={Boolean(fieldErrors.email)} aria-describedby={fieldErrors.email ? 'email-error' : undefined} className={AUTH_INPUT} />
            {fieldErrors.email ? <p id="email-error" className="mt-2 text-sm text-red-300">{fieldErrors.email}</p> : null}
          </div> : null}
          {(step === 'credentials' && mode !== 'recovery' && mode !== 'confirmation') || step === 'password' ? <>
            <PasswordField id="password" label={step === 'password' ? authCopy.newPasswordLabel : authCopy.password} autoComplete={mode === 'signIn' && step !== 'password' ? 'current-password' : 'new-password'} hint={mode === 'signUp' || step === 'password'} error={fieldErrors.password} />
            {mode === 'signUp' || step === 'password' ? <PasswordField id="confirm-password" label={authCopy.confirmPassword} autoComplete="new-password" error={fieldErrors['confirm-password']} /> : null}
          </> : null}
          {step === 'verify' ? <div>
            <label htmlFor="otp" className="mb-2 block text-sm font-medium">{authCopy.otp}</label>
            <input id="otp" name="otp" type="text" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} required
              aria-invalid={Boolean(fieldErrors.otp)} aria-describedby={fieldErrors.otp ? 'otp-error' : 'otp-hint'} className={`${AUTH_INPUT} text-center font-mono text-2xl tracking-[0.4em]`} />
            {fieldErrors.otp ? <p id="otp-error" className="mt-2 text-sm text-red-300">{fieldErrors.otp}</p> : null}
            <p id="otp-hint" className="text-text-secondary mt-3 text-sm leading-relaxed">{authCopy.verify.hint}</p>
          </div> : null}
        </fieldset>
        {error ? <p role="alert" className="text-sm leading-relaxed text-red-300">{error}</p> : null}
        {notice ? <p role="status" className="text-accent-cyan text-sm leading-relaxed">{notice}</p> : null}
        <button type="submit" disabled={busy} className={submitClass}>
          {busy ? <><LoaderCircle size={18} className="animate-spin motion-reduce:animate-none" aria-hidden="true" />{authCopy.working}</> : <>{step === 'verify' ? authCopy.verify.action : step === 'password' ? authCopy.newPassword.action : checkout ? (mode==='signIn'?checkoutCopy.loginAction:checkoutCopy.registerAction) : copy.action}<ArrowRight size={18} aria-hidden="true" /></>}
        </button>
      </form>
      {step === 'verify' ? <div className="mt-5 space-y-4 text-center text-sm">
        <button type="button" onClick={resend} disabled={busy || cooldown > 0} className="text-accent-cyan min-h-11 px-3 underline-offset-4 hover:underline disabled:text-text-secondary">{cooldown ? authCopy.wait(cooldown) : authCopy.verify.resend}</button>
        <button type="button" disabled={busy} onClick={() => { setStep('credentials'); setFieldErrors({}); setError(''); setNotice(''); }} className="text-text-secondary hover:text-text-primary block min-h-11 w-full">{authCopy.verify.changeEmail}</button>
      </div> : null}
      {mode === 'signIn' && step === 'credentials' ? <Link href={next === '/checkout' || next === '/admin' ? '/recuperar-contrasena?next='+next : '/recuperar-contrasena'} className="text-accent-cyan mt-4 flex min-h-11 items-center justify-center text-sm underline-offset-4 hover:underline">{checkout ? checkoutCopy.forgot : authCopy.forgot}</Link> : null}
      {checkout && mode==='signIn' ? <Link href="/verificar?codigo=1&next=/checkout" className="text-accent-cyan flex min-h-11 items-center justify-center text-sm underline-offset-4 hover:underline">{checkoutCopy.haveCode}</Link> : null}
      {!checkout ? <p className="text-text-secondary border-border-editorial mt-7 border-t pt-6 text-center text-sm leading-relaxed">{copy.alternate} <Link href={(mode === 'signIn' ? '/crear-cuenta' : '/iniciar-sesion')+(next === '/admin'?'?next=/admin':'')} className="text-accent-cyan inline-flex min-h-11 items-center underline-offset-4 hover:underline">{copy.link}</Link></p> : null}
    </div>
  );
}

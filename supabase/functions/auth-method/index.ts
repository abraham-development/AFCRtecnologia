import { createClient } from 'npm:@supabase/supabase-js@2.117.2';
// @ts-types="npm:@types/nodemailer@8.0.2"
import nodemailer from 'npm:nodemailer@10.0.15';
import { authCopy } from '../../../src/content/auth.ts';

const url = Deno.env.get('SUPABASE_URL')!;
const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const admin = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
const origins = new Set(['https://afcrtecnologia.com', 'http://localhost:3000']);
const mailConfig = JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(Deno.env.get('AFCR_MAIL_CONFIG_B64')!), c=>c.charCodeAt(0))));
const mailer = nodemailer.createTransport({
  host: mailConfig.host, port: 465, secure: true,
  auth: { user: mailConfig.user, pass: mailConfig.password },
  connectionTimeout: 10000, greetingTimeout: 10000, socketTimeout: 15000,
});
const escape = (value: string) => value.replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]!));
async function digest(user: string, id: string, token: string) {
  const encoder = new TextEncoder();
  const cryptoKey = await crypto.subtle.importKey('raw', encoder.encode(key), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const hash = await crypto.subtle.sign('HMAC', cryptoKey, encoder.encode(`${user}:${id}:${token}`));
  return Array.from(new Uint8Array(hash), byte => byte.toString(16).padStart(2, '0')).join('');
}
function otp() {
  const bytes = new Uint32Array(1);
  do { crypto.getRandomValues(bytes); } while (bytes[0] >= 4294000000);
  return String(bytes[0] % 1000000).padStart(6, '0');
}
function status(code: string) {
  return code === 'AFCR_SESSION_EXPIRED' ? 401 : code === 'AFCR_RATE_LIMIT' ? 429 : 400;
}

Deno.serve(async request => {
  const origin = request.headers.get('origin');
  const headers = { 'Content-Type':'application/json', 'Cache-Control':'no-store', 'Vary':'Origin',
    ...(origin && origins.has(origin) ? { 'Access-Control-Allow-Origin':origin } : {}),
    'Access-Control-Allow-Headers':'authorization, apikey, content-type, x-client-info',
    'Access-Control-Allow-Methods':'POST, OPTIONS' };
  const response = (body: unknown, code = 200) => new Response(JSON.stringify(body), { status: code, headers });
  if (origin && !origins.has(origin)) return response({ error:'AFCR_INVALID_ORIGIN' }, 403);
  if (request.method === 'OPTIONS') return new Response(null, { status:204, headers });
  if (request.method !== 'POST') return response({ error:'AFCR_INVALID_REQUEST' }, 405);
  try {
    const bearer = request.headers.get('authorization')?.match(/^Bearer (.+)$/i)?.[1];
    if (!bearer || bearer.length > 16000) return response({ error:'AFCR_SESSION_EXPIRED' }, 401);
    const { data, error } = await admin.auth.getUser(bearer);
    if (error || !data.user?.email || !data.user.email_confirmed_at) return response({ error:'AFCR_SESSION_EXPIRED' },401);
    // getUser validó firma y vencimiento; nunca confiar en claims sin esa validación.
    const claims = JSON.parse(atob(bearer.split('.')[1].replace(/-/g,'+').replace(/_/g,'/')));
    const base = { user_id:data.user.id, session_id:claims.session_id, revision:claims.afcr_revision };
    const text = await request.text();
    if (text.length > 4096) return response({ error:'AFCR_INVALID_REQUEST' },400);
    const body = JSON.parse(text);
    async function operation(payload: Record<string, unknown>) {
      const { data: result, error: issue } = await admin.rpc('afcr_auth_method_operation', { payload: { ...payload, ...base } });
      if (issue) throw new Error('AFCR_UNAVAILABLE');
      return result as { error?:string; method?:string; id?:string; target?:string; pending?:unknown; verified?:boolean };
    }
    if (body.action === 'status') {
      const result = await operation({ operation:'status' });
      return response(result, result.error ? status(result.error) : 200);
    }
    if (body.action === 'request') {
      if (!['google','password'].includes(body.target)) return response({ error:'AFCR_INVALID_REQUEST' },400);
      const id = crypto.randomUUID(); const token = otp();
      const result = await operation({ operation:'request', id, target:body.target, email:data.user.email, hash:await digest(data.user.id,id,token) });
      if (result.error) return response(result,status(result.error));
      try {
        const email = authCopy.methodChange.email;
        const target = body.target === 'google' ? authCopy.account.google : authCopy.account.password;
        const message = `${email.body} ${target}.`;
        await mailer.sendMail({ from:{name:mailConfig.name,address:mailConfig.from}, to:data.user.email,
          subject:email.subject, text:`${message}\n\n${token}\n\n${authCopy.emailMessage.expiry}\n${authCopy.emailMessage.security}`,
          html:`<div style="background:#0d1828;color:#f0ece4;padding:32px;font-family:Arial,sans-serif;max-width:480px"><h1 style="font-size:24px">${escape(email.title)}</h1><p>${escape(message)}</p><p style="font-size:32px;letter-spacing:6px;font-family:monospace">${token}</p><p>${escape(authCopy.emailMessage.expiry)}</p><p>${escape(authCopy.emailMessage.security)}</p></div>` });
      } catch {
        await operation({ operation:'cancel', id });
        return response({ error:'AFCR_EMAIL_UNAVAILABLE' },503);
      }
      return response(result);
    }
    if (!/^[0-9a-f-]{36}$/i.test(body.id ?? '')) return response({ error:'AFCR_INVALID_REQUEST' },400);
    if (body.action === 'cancel') {
      const result = await operation({ operation:'cancel', id:body.id });
      return response(result,result.error ? status(result.error) : 200);
    }
    if (!['verify_google','complete_password'].includes(body.action) || !/^\d{6}$/.test(body.token ?? '')) return response({ error:'AFCR_INVALID_REQUEST' },400);
    if (body.action === 'complete_password' && (typeof body.password !== 'string' || body.password.length<12 || new TextEncoder().encode(body.password).length>72 || !/[a-z]/.test(body.password) || !/[A-Z]/.test(body.password) || !/\d/.test(body.password))) return response({ error:'AFCR_WEAK_PASSWORD' },400);
    const completionId = body.action === 'complete_password' ? crypto.randomUUID() : undefined;
    const checked = await operation({ operation:'verify', id:body.id, hash:await digest(data.user.id,body.id,body.token),completion_id:completionId });
    if (checked.error) return response(checked,status(checked.error));
    if (body.action === 'verify_google') return checked.target === 'google' ? response(checked) : response({ error:'AFCR_INVALID_TARGET' },400);
    if (checked.target !== 'password') return response({ error:'AFCR_INVALID_TARGET' },400);
    const { error: passwordError } = await admin.auth.admin.updateUserById(data.user.id,{ password:body.password });
    if (passwordError) {
      await operation({operation:'release_password',id:body.id,completion_id:completionId});
      return response({ error:passwordError.code === 'weak_password' ? 'AFCR_WEAK_PASSWORD' : 'AFCR_UNAVAILABLE' },400);
    }
    // Si esta escritura falla, Google sigue activo: no dejar la cuenta sin acceso.
    const completed = await operation({ operation:'complete_password', id:body.id,completion_id:completionId });
    if (completed.error) return response(completed,status(completed.error));
    await admin.auth.admin.signOut(bearer,'global');
    return response({ ok:true, method:'password' });
  } catch {
    return response({ error:'AFCR_UNAVAILABLE' },503);
  }
});

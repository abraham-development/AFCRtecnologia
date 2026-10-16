import { createClient } from 'npm:@supabase/supabase-js@2.117.2';

// Cobro de pedidos con Culqi. El importe sale de la base; el navegador solo aporta el token de Culqi.
const url = Deno.env.get('SUPABASE_URL')!;
const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const secret = Deno.env.get('CULQI_SECRET_KEY') ?? '';
const admin = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
const origins = new Set(['https://afcrtecnologia.com', 'https://www.afcrtecnologia.com', 'http://localhost:3000']);
const API = 'https://api.culqi.com/v2';
const TOKEN = /^[a-z]{3}_(test|live)_[A-Za-z0-9]{8,40}$/;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const THREE_DS = ['eci', 'xid', 'cavv', 'protocolVersion', 'directoryServerTransactionId'];
// Una venta sin respuesta se concilia con Culqi; pasado este margen sin cargo, se libera el pedido.
const RECONCILE_GRACE_SECONDS = 600;

/** Campos que se leen de cargos, errores, eventos y listados de Culqi. */
interface Body {
  object?: string; id?: string; amount?: number; currency_code?: string; action_code?: string; type?: string; code?: string;
  decline_code?: string; user_message?: string; merchant_message?: string; charge_id?: string; data?: unknown;
  outcome?: { type?: string; code?: string; user_message?: string; merchant_message?: string };
  metadata?: { attempt_id?: string; order_id?: string };
}
type Culqi = { status: number; body: Body | null } | null;
type Attempt = { attempt_id: string; amount: number; charge_id: string | null; since: number };

async function culqi(path: string, body?: unknown): Promise<Culqi> {
  try {
    const response = await fetch(API + path, {
      method: body ? 'POST' : 'GET',
      headers: { Authorization: `Bearer ${secret}`, 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(25000),
    });
    const text = await response.text();
    let parsed = null;
    try { parsed = JSON.parse(text); } catch { /* respuesta no JSON */ }
    return { status: response.status, body: parsed };
  } catch {
    return null;
  }
}

async function operation(payload: Record<string, unknown>) {
  const { data, error } = await admin.rpc('store_culqi_operation', { payload });
  if (error) throw new Error('STORE_UNAVAILABLE');
  return data as Record<string, unknown>;
}

const clip = (value: unknown, max: number) => typeof value === 'string' && value.trim() ? value.trim().slice(0, max) : undefined;
const succeeded = (charge: Body) => charge?.object === 'charge'
  && (charge.outcome?.type === 'venta_exitosa' || charge.outcome?.code === 'AUT0000');

function finishCharge(attempt: string, charge: Body) {
  return operation({ operation: 'finish', attempt_id: attempt, outcome: 'succeeded', charge_id: charge.id,
    amount: charge.amount, currency: charge.currency_code, code: clip(charge.outcome?.code, 100),
    user_message: clip(charge.outcome?.user_message, 500), merchant_message: clip(charge.outcome?.merchant_message, 500) });
}

/** Busca en Culqi el cargo de un intento sin respuesta; nunca cobra de nuevo. */
async function reconcile(attempt: Attempt, email: string): Promise<'succeeded' | 'failed' | 'uncertain'> {
  let charge: Body | undefined;
  if (attempt.charge_id) {
    const found = await culqi(`/charges/${attempt.charge_id}`);
    if (!found || found.status >= 500) return 'uncertain';
    if (found.status === 200) charge = found.body ?? undefined;
  } else {
    const query = new URLSearchParams({ email, amount: String(attempt.amount), limit: '50' });
    const list = await culqi(`/charges?${query}`);
    if (!list || list.status !== 200 || !Array.isArray(list.body?.data)) return 'uncertain';
    charge = (list.body.data as Body[]).find(item => item?.metadata?.attempt_id === attempt.attempt_id);
  }
  if (charge && succeeded(charge)) {
    const result = await finishCharge(attempt.attempt_id, charge);
    return result.status === 'succeeded' ? 'succeeded' : 'uncertain';
  }
  if (charge || Date.now() / 1000 - attempt.since > RECONCILE_GRACE_SECONDS) {
    await operation({ operation: 'finish', attempt_id: attempt.attempt_id, outcome: 'failed', code: charge ? clip(charge.outcome?.code, 100) : 'NOT_FOUND' });
    return 'failed';
  }
  return 'uncertain';
}

/** Webhook de Culqi: el cuerpo no se cree; el evento y el cargo se vuelven a leer con la llave privada. */
async function webhook(request: Request) {
  const text = await request.text();
  if (text.length > 65536) return new Response(null, { status: 413 });
  let id = '';
  try { id = JSON.parse(text)?.id ?? ''; } catch { /* cuerpo inválido */ }
  if (!/^evt_(test|live)_[A-Za-z0-9]{8,40}$/.test(id)) return new Response(null, { status: 200 });
  const event = await culqi(`/events/${id}`);
  if (!event || event.status >= 500) return new Response(null, { status: 503 });
  if (event.status !== 200 || event.body?.type !== 'charge.creation.succeeded') return new Response(null, { status: 200 });
  let data = event.body.data;
  if (typeof data === 'string') { try { data = JSON.parse(data); } catch { data = null; } }
  const chargeId = (data as Body | null)?.id;
  if (typeof chargeId !== 'string' || !/^chr_(test|live)_[A-Za-z0-9]{8,40}$/.test(chargeId)) return new Response(null, { status: 200 });
  const charge = await culqi(`/charges/${chargeId}`);
  if (!charge || charge.status >= 500) return new Response(null, { status: 503 });
  const attempt = charge.body?.metadata?.attempt_id ?? '';
  if (charge.status === 200 && charge.body && succeeded(charge.body) && UUID.test(attempt)) {
    // Ya cerrado por el flujo normal: finish devuelve STORE_INVALID_STATE y no cambia nada.
    await finishCharge(attempt, charge.body).catch(() => null);
  }
  return new Response(null, { status: 200 });
}

Deno.serve(async request => {
  if (new URL(request.url).pathname.endsWith('/webhook')) {
    if (request.method !== 'POST') return new Response(null, { status: 405 });
    try { return await webhook(request); } catch { return new Response(null, { status: 503 }); }
  }
  const origin = request.headers.get('origin');
  const headers = { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', Vary: 'Origin',
    ...(origin && origins.has(origin) ? { 'Access-Control-Allow-Origin': origin } : {}),
    'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info',
    'Access-Control-Allow-Methods': 'POST, OPTIONS' };
  const response = (body: unknown, code = 200) => new Response(JSON.stringify(body), { status: code, headers });
  if (origin && !origins.has(origin)) return response({ error: 'STORE_INVALID_ORIGIN' }, 403);
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers });
  if (request.method !== 'POST') return response({ error: 'STORE_INVALID' }, 405);
  if (!secret.startsWith('sk_')) return response({ error: 'STORE_UNAVAILABLE' }, 503);
  try {
    const bearer = request.headers.get('authorization')?.match(/^Bearer (.+)$/i)?.[1];
    if (!bearer || bearer.length > 16000) return response({ error: 'STORE_SESSION' }, 401);
    const { data, error } = await admin.auth.getUser(bearer);
    if (error || !data.user?.email || !data.user.email_confirmed_at) return response({ error: 'STORE_SESSION' }, 401);
    // getUser validó firma y vencimiento; nunca confiar en claims sin esa validación.
    const claims = JSON.parse(atob(bearer.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    const text = await request.text();
    if (text.length > 4096) return response({ error: 'STORE_INVALID' }, 400);
    const body = JSON.parse(text);
    if (!UUID.test(body?.order_id ?? '') || !TOKEN.test(body?.token_id ?? '') || body.device_id != null && !UUID.test(body.device_id)) {
      return response({ error: 'STORE_INVALID' }, 400);
    }
    let authentication: Record<string, string> | undefined;
    if (body.authentication_3DS != null) {
      const source = body.authentication_3DS;
      if (typeof source !== 'object' || Array.isArray(source)) return response({ error: 'STORE_INVALID' }, 400);
      authentication = {};
      for (const name of THREE_DS) {
        if (source[name] == null) continue;
        if (typeof source[name] !== 'string' || source[name].length > 200) return response({ error: 'STORE_INVALID' }, 400);
        authentication[name] = source[name];
      }
    }
    const email = data.user.email;
    const begin = () => operation({ operation: 'begin', user_id: data.user.id, session_id: claims.session_id, revision: claims.afcr_revision,
      order_id: body.order_id, token_id: body.token_id, device_id: body.device_id ?? null, authentication_3DS: authentication ?? null });
    let started = await begin();
    if (started.uncertain) {
      const state = await reconcile(started.uncertain as Attempt, email);
      if (state === 'succeeded') return response({ paid: true });
      if (state === 'uncertain') return response({ pending: true }, 202);
      started = await begin();
    }
    if (started.paid) return response({ paid: true });
    if (started.error) {
      const code = started.error as string;
      return response({ error: code }, code === 'STORE_SESSION' ? 401 : code === 'STORE_INVALID' ? 400 : 409);
    }
    const charge = await culqi('/charges', {
      amount: started.amount as number, currency_code: 'PEN', email: email.slice(0, 50), source_id: body.token_id, capture: true,
      description: `Pedido AFCR ${String(started.order_id).slice(0, 8).toUpperCase()}`,
      metadata: { order_id: started.order_id, attempt_id: started.attempt_id },
      antifraud_details: Object.fromEntries(Object.entries({
        first_name: clip(started.names, 50), last_name: clip(started.surnames, 50), phone_number: clip(started.mobile, 15),
        address: clip(started.street, 100), address_city: clip(started.city, 30), country_code: 'PE',
        device_finger_print_id: started.device_id ?? undefined,
      }).filter(([, value]) => value !== undefined)),
      ...(authentication ? { authentication_3DS: authentication } : {}),
    });
    const attempt = started.attempt_id as string;
    // Sin respuesta, o error del servidor de Culqi: puede haberse cobrado. Se concilia, no se repite.
    if (!charge || charge.status >= 500 || !charge.body) {
      await operation({ operation: 'finish', attempt_id: attempt, outcome: 'uncertain', code: charge ? `HTTP_${charge.status}` : 'NETWORK' });
      return response({ pending: true }, 202);
    }
    if (charge.status === 201 && charge.body.object === 'charge') {
      const result = await finishCharge(attempt, charge.body);
      return result.status === 'succeeded' ? response({ paid: true }) : response({ pending: true }, 202);
    }
    if (charge.status === 200 && charge.body.action_code === 'REVIEW') {
      await operation({ operation: 'finish', attempt_id: attempt, outcome: 'needs_3ds', code: 'REVIEW' });
      return response({ review: true, amount: started.amount });
    }
    const issue = charge.body;
    await operation({ operation: 'finish', attempt_id: attempt, outcome: 'failed', charge_id: issue.charge_id,
      code: clip(issue.code ?? issue.type, 100), decline_code: clip(issue.decline_code, 100),
      user_message: clip(issue.user_message, 500), merchant_message: clip(issue.merchant_message, 500) });
    if (issue.type === 'authentication_error') return response({ error: 'STORE_UNAVAILABLE' }, 503);
    return response({ error: 'PAYMENT_DECLINED', message: clip(issue.user_message, 300) ?? null }, 402);
  } catch {
    return response({ error: 'STORE_UNAVAILABLE' }, 503);
  }
});

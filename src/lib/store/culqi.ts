'use client';
import { getAuthClient } from '@/lib/auth/client';
import { checkoutCopy } from '@/content/store';

/** Culqi Checkout tokeniza en el navegador; la Edge Function `culqi-payment` cobra con el importe de la base. */
interface CulqiInstance { open(): void; close(): void; culqi?: () => void; token?: { id: string }; order?: unknown; error?: { user_message?: string; merchant_message?: string } }
interface Culqi3DSApi { publicKey: string; settings: unknown; options: unknown; generateDevice(): Promise<string | null>; initAuthentication(token: string): Promise<void>; reset(): void }
declare global { interface Window { CulqiCheckout?: new (publicKey: string, config: unknown) => CulqiInstance; Culqi3DS?: Culqi3DSApi } }

export const culqiPublicKey = process.env.NEXT_PUBLIC_CULQI_PUBLIC_KEY ?? '';
export const culqiReady = /^pk_(test|live)_/.test(culqiPublicKey);
export const culqiTestMode = culqiPublicKey.startsWith('pk_test_');

export interface PayableOrder { id: string; total: number }
export interface Payer { email: string; names: string; surnames: string }
export type ChargeResult = { status: 'paid' } | { status: 'pending' } | { status: 'declined'; message: string } | { status: 'error'; code: string };

const scripts = new Map<string, Promise<void>>();
function load(src: string) {
  let pending = scripts.get(src);
  if (!pending) {
    pending = new Promise<void>((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => { scripts.delete(src); script.remove(); reject(new Error('CULQI_SCRIPT')); };
      document.body.appendChild(script);
    });
    scripts.set(src, pending);
  }
  return pending;
}

/** Carga diferida: los scripts de Culqi solo entran cuando el cliente llega al pago. */
export async function loadCulqi() {
  await Promise.all([load('https://js.culqi.com/checkout-js'), load('https://3ds.culqi.com')]);
  if (!window.CulqiCheckout || !window.Culqi3DS) throw new Error('CULQI_SCRIPT');
}

const cents = (total: number) => Math.round(total * 100);

/** Abre el formulario de Culqi (tarjeta o Yape). Cerrarlo sin pagar no dispara ningún callback. */
export function openCulqiCheckout(order: PayableOrder, payer: Payer, onToken: (token: string) => void, onError: (message: string) => void) {
  const Checkout = window.CulqiCheckout;
  if (!Checkout) { onError(checkoutCopy.paymentUnavailable); return; }
  const paymentMethods = { tarjeta: true, yape: true, billetera: false, bancaMovil: false, agente: false, cuotealo: false };
  const checkout = new Checkout(culqiPublicKey, {
    settings: { title: 'AFCRtecnologia', currency: 'PEN', amount: cents(order.total) },
    client: { email: payer.email, firstName: payer.names, lastName: payer.surnames },
    options: { lang: 'auto', installments: false, modal: true, paymentMethods, paymentMethodsSort: ['tarjeta', 'yape'] },
    appearance: { theme: 'default', menuType: 'sidebar', hiddenCulqiLogo: false, hiddenEmail: true, buttonCardPayText: checkoutCopy.payCard,
      defaultStyle: { bannerColor: '#1a2539', buttonBackground: '#5bc2d8', buttonTextColor: '#0d1828', menuColor: '#5bc2d8', linksColor: '#5bc2d8', priceColor: '#0d1828' } },
  });
  checkout.culqi = () => {
    if (checkout.token?.id) { checkout.close(); onToken(checkout.token.id); }
    else if (checkout.error) onError(checkout.error.user_message ?? checkoutCopy.paymentFailed);
  };
  checkout.open();
}

async function charge(body: Record<string, unknown>): Promise<Record<string, unknown>> {
  const { data, error } = await getAuthClient().functions.invoke('culqi-payment', { body });
  if (!error) return (data ?? {}) as Record<string, unknown>;
  if (error.context instanceof Response) {
    const response = await error.context.json().catch(() => null);
    if (response && typeof response === 'object') return response;
  }
  return { error: 'STORE_UNAVAILABLE' };
}

/** Culqi3DS responde por postMessage en el mismo origen; sin respuesta en 10 min se abandona. */
function authenticate(token: string, amount: number, email: string) {
  const library = window.Culqi3DS!;
  library.settings = { charge: { totalAmount: amount, returnUrl: window.location.href, currency: 'PEN' }, card: { email } };
  library.options = { showModal: true, showLoading: true, showIcon: true, closeModalAction() {}, style: { btnColor: '#5bc2d8', btnTextColor: '#0d1828' } };
  return new Promise<Record<string, string>>((resolve, reject) => {
    const timer = window.setTimeout(() => finish(() => reject(new Error('CULQI_3DS'))), 600000);
    function finish(done: () => void) { window.clearTimeout(timer); window.removeEventListener('message', listener); done(); }
    function listener(event: MessageEvent) {
      if (event.origin !== window.location.origin || !event.data || typeof event.data !== 'object') return;
      if (event.data.parameters3DS) finish(() => resolve(event.data.parameters3DS));
      else if (typeof event.data.error === 'string') finish(() => reject(new Error('CULQI_3DS')));
    }
    window.addEventListener('message', listener);
    library.initAuthentication(token).catch(() => finish(() => reject(new Error('CULQI_3DS'))));
  });
}

function interpret(result: Record<string, unknown>): ChargeResult | null {
  if (result.paid) return { status: 'paid' };
  if (result.pending) return { status: 'pending' };
  if (result.error === 'PAYMENT_DECLINED') return { status: 'declined', message: typeof result.message === 'string' ? result.message : checkoutCopy.paymentFailed };
  if (typeof result.error === 'string') return { status: 'error', code: result.error };
  return null;
}

/** Cobra un token: primer cargo y, si Culqi lo pide, autenticación 3DS y segundo cargo con el mismo token. */
export async function chargeOrder(order: PayableOrder, token: string, email: string): Promise<ChargeResult> {
  const library = window.Culqi3DS!;
  library.reset();
  library.publicKey = culqiPublicKey;
  const device = await library.generateDevice().catch(() => null);
  const base = { order_id: order.id, token_id: token, ...(device ? { device_id: device } : {}) };
  const first = await charge(base);
  const settled = interpret(first);
  if (settled) return settled;
  if (!first.review) return { status: 'error', code: 'STORE_UNAVAILABLE' };
  let parameters: Record<string, string>;
  try { parameters = await authenticate(token, typeof first.amount === 'number' ? first.amount : cents(order.total), email); }
  catch { return { status: 'declined', message: checkoutCopy.authenticationFailed }; }
  finally { library.reset(); }
  return interpret(await charge({ ...base, authentication_3DS: parameters })) ?? { status: 'error', code: 'STORE_UNAVAILABLE' };
}

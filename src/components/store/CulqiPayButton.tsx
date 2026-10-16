'use client';
import { useEffect, useRef, useState } from 'react';
import { CreditCard, LoaderCircle } from 'lucide-react';
import { checkoutCopy as copy } from '@/content/store';
import { formatPrice } from '@/lib/store/price';
import { chargeOrder, culqiReady, culqiTestMode, loadCulqi, openCulqiCheckout, type PayableOrder, type Payer } from '@/lib/store/culqi';
import { Button, Toast } from './StoreUI';

const errors: Record<string, string> = {
  STORE_SESSION: copy.sessionExpired, STORE_ORDER_CLOSED: copy.orderExpired, STORE_ORDER_NOT_FOUND: copy.orderExpired,
  STORE_PAYMENT_BUSY: copy.paymentBusy, STORE_PAYMENT_LIMIT: copy.paymentLimit,
};

/** Paga un pedido ya registrado. Se reutiliza en el checkout y en Mis pedidos. */
export function CulqiPayButton({ order, payer, autoOpen = false, onPaid, onPending, onExpired }: {
  order: PayableOrder; payer: Payer; autoOpen?: boolean; onPaid: () => void; onPending?: () => void; onExpired?: (code: string) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [charging, setCharging] = useState(false);
  const [error, setError] = useState('');
  const opened = useRef(false);

  async function open() {
    if (loading || charging) return;
    setError('');
    setLoading(true);
    try { await loadCulqi(); }
    catch { setError(copy.paymentUnavailable); return; }
    finally { setLoading(false); }
    openCulqiCheckout(order, payer, async token => {
      setCharging(true);
      try {
        const result = await chargeOrder(order, token, payer.email);
        if (result.status === 'paid') onPaid();
        else if (result.status === 'pending') { setError(copy.paymentPending); onPending?.(); }
        else if (result.status === 'declined') setError(result.message);
        else {
          setError(errors[result.code] ?? copy.paymentFailed);
          if (result.code === 'STORE_SESSION' || result.code === 'STORE_ORDER_CLOSED' || result.code === 'STORE_ORDER_NOT_FOUND') onExpired?.(result.code);
        }
      } catch { setError(copy.paymentFailed); }
      finally { setCharging(false); }
    }, setError);
  }

  useEffect(() => {
    // Recién creado el pedido, el formulario se abre solo una vez; después queda el botón.
    if (!autoOpen || opened.current || !culqiReady) return;
    opened.current = true;
    const frame = requestAnimationFrame(() => { void open(); });
    return () => cancelAnimationFrame(frame);
  });

  if (!culqiReady) return <Toast message={copy.paymentUnavailable} error />;
  return <div className="space-y-4">
    {culqiTestMode ? <p className="border border-amber-400/40 p-4 text-sm leading-relaxed text-amber-200">{copy.testMode}</p> : null}
    <Toast message={error} error />
    <Button disabled={loading || charging} onClick={() => void open()} className="w-full">
      {loading || charging ? <><LoaderCircle size={18} className="animate-spin motion-reduce:animate-none" aria-hidden="true" />{charging ? copy.charging : copy.loadingPayment}</>
        : <><CreditCard size={18} aria-hidden="true" />{copy.pay} {formatPrice(order.total)}</>}
    </Button>
    <p className="text-sm leading-relaxed text-text-secondary">{copy.paymentMethods}</p>
  </div>;
}

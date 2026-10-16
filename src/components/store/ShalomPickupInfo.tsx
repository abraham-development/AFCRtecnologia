'use client';
import { useState } from 'react';
import { Check, Copy, ExternalLink, MapPin } from 'lucide-react';
import type { Order } from '@/lib/store/types';
import { checkoutCopy as copy } from '@/content/store';

/** Dato de recojo con botón para copiarlo: el cliente lo pega en el rastreo de Shalom o lo dicta en la agencia. */
function Datum({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);
  async function copyValue() {
    try { await navigator.clipboard.writeText(value); setCopied(true); window.setTimeout(() => setCopied(false), 1800); } catch { /* sin portapapeles: el dato sigue visible */ }
  }
  return <div className="min-w-0">
    <dt className="text-xs uppercase tracking-[0.12em] text-text-secondary">{label}</dt>
    <dd className="mt-1 flex items-center gap-2">
      <span className="min-w-0 break-all font-mono text-lg tracking-wider text-text-primary">{value}</span>
      <button type="button" onClick={copyValue} aria-label={`${copy.copyCode} ${label}`}
        className="flex h-11 w-11 shrink-0 items-center justify-center text-text-secondary transition-colors hover:text-accent-cyan">
        {copied ? <Check size={16} className="text-green-300" aria-hidden="true" /> : <Copy size={16} aria-hidden="true" />}
      </button>
      <span role="status" className="sr-only">{copied ? copy.copied : ''}</span>
    </dd>
  </div>;
}

/** Recojo en Shalom dentro de Mis pedidos: agencia, N° de orden y clave cuando el panel los registra, y enlace al rastreo. */
export function ShalomPickupInfo({ order }: { order: Order }) {
  const address = order.shipping_address;
  const ready = Boolean(order.tracking_reference);
  return <div className="mt-5 border border-orange-400/40 p-4 sm:p-5">
    <p className="flex items-center gap-2 font-medium"><MapPin size={16} className="shrink-0 text-orange-300" aria-hidden="true" />{copy.shalomTitle}</p>
    <p className="mt-2 text-sm leading-relaxed text-text-secondary">
      <strong className="font-medium text-text-primary">{address.pickupPointName}</strong> · {address.street}, {address.district}, {address.department}
    </p>
    {ready ? <>
      <dl className="mt-4 grid gap-4 sm:grid-cols-2">
        <Datum label={copy.shalomOrder} value={order.tracking_reference!} />
        {order.pickup_code ? <Datum label={copy.shalomKey} value={order.pickup_code} /> : null}
      </dl>
      <p className="mt-3 text-sm leading-relaxed text-text-secondary">{copy.shalomBring}</p>
      <a href={copy.shalomTrackUrl} target="_blank" rel="noopener noreferrer"
        className="mt-2 inline-flex min-h-11 items-center gap-2 text-sm text-accent-cyan underline-offset-4 hover:underline">
        <ExternalLink size={14} aria-hidden="true" />{copy.shalomTrack}
      </a>
    </> : <p className="mt-3 text-sm leading-relaxed text-text-secondary">{copy.shalomPending}</p>}
  </div>;
}

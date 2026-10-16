'use client';
import { Check, Clock, MapPin, Navigation, Phone, Truck, X } from 'lucide-react';
import type { PickupPoint } from '@/data/pickup-points';
import { resolvePeruLocation } from '@/lib/peru-ubigeo';
import { checkoutCopy as copy } from '@/content/store';
import { formatPrice } from '@/lib/store/price';

/** Ruta en Google Maps hacia la agencia; con coordenadas exactas llega a la puerta, sin ellas busca por dirección. */
export function directionsUrl(point: PickupPoint) {
  if (point.lat != null && point.lng != null) return `https://www.google.com/maps/dir/?api=1&destination=${point.lat},${point.lng}`;
  const city = resolvePeruLocation(point.ubigeo);
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([point.name, point.street, city?.district, city?.department, 'Perú'].filter(Boolean).join(', '))}`;
}
export function agencyPath(point: PickupPoint) {
  const city = resolvePeruLocation(point.ubigeo);
  return city ? `${city.department} / ${city.province} / ${city.district}` : '';
}

/** «S/ 18.00 · Terrestre»: tarifa de envío hasta la agencia y su modalidad. */
export function shippingLabel(point: PickupPoint) {
  if (point.shipping_price == null) return '';
  return [formatPrice(Number(point.shipping_price)), point.shipping_mode ? copy.modes[point.shipping_mode] : ''].filter(Boolean).join(' · ');
}

/** Ficha de agencia sobre el mapa: panel lateral en pantallas anchas y hoja inferior en angostas. */
export function AgencyCard({ point, chosen, onChoose, onClose }: { point: PickupPoint; chosen: boolean; onChoose: () => void; onClose: () => void }) {
  return <article aria-label={point.name} className="flex max-h-full min-h-0 flex-1 flex-col overflow-hidden border border-border-editorial bg-bg-darkest/95 shadow-[0_18px_48px_rgb(0_0_0/0.45)] backdrop-blur">
    <div className="flex items-start gap-3 border-b border-border-editorial p-4">
      <MapPin size={22} className="mt-0.5 shrink-0 text-accent-cyan" aria-hidden="true" />
      <div className="min-w-0 flex-1">
        <h3 className="font-medium leading-snug break-words">{point.name}</h3>
        <p className="mt-1 text-xs uppercase tracking-[0.08em] text-text-secondary">{agencyPath(point)}</p>
      </div>
      <button type="button" onClick={onClose} aria-label={copy.closeCard} className="-m-2 flex h-11 w-11 shrink-0 items-center justify-center text-text-secondary hover:text-text-primary">
        <X size={18} aria-hidden="true" />
      </button>
    </div>
    <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4 text-sm">
      {point.shipping_price != null ? <div className="flex items-center gap-3 border border-orange-400/40 bg-orange-400/5 px-3 py-2.5">
        <Truck size={18} className="shrink-0 text-orange-300" aria-hidden="true" />
        <p className="min-w-0"><span className="block text-xs text-text-secondary">{copy.shippingTo}</span><strong className="font-medium tabular-nums text-text-primary">{shippingLabel(point)}</strong></p>
      </div> : null}
      <div>
        <p className="break-words text-text-primary">{point.street}</p>
        <p className="mt-1 break-words text-text-secondary">{point.reference}</p>
      </div>
      <div className="flex gap-3">
        <Clock size={16} className="mt-0.5 shrink-0 text-accent-cyan" aria-hidden="true" />
        <ul className="space-y-1 text-text-secondary">{point.hours.split(' · ').map(line => <li key={line}>{line}</li>)}</ul>
      </div>
      <p className="flex gap-3 text-text-secondary"><Phone size={16} className="mt-0.5 shrink-0 text-accent-cyan" aria-hidden="true" />{copy.shalomPhone}</p>
      <a href={directionsUrl(point)} target="_blank" rel="noopener noreferrer"
        className="inline-flex min-h-11 items-center gap-2 text-accent-cyan underline-offset-4 hover:underline">
        <Navigation size={15} aria-hidden="true" />{copy.directions}
      </a>
    </div>
    <div className="border-t border-border-editorial p-4">
      <button type="button" onClick={onChoose} aria-pressed={chosen}
        className={`flex min-h-12 w-full items-center justify-center gap-2 px-4 font-medium transition-colors ${chosen ? 'border border-orange-400 text-orange-300' : 'bg-orange-400 text-bg-darkest hover:bg-orange-300'}`}>
        {chosen ? <><Check size={18} aria-hidden="true" />{copy.pointChosen}</> : copy.choosePoint}
      </button>
    </div>
  </article>;
}

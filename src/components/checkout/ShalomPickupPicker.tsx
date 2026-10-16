'use client';
import { useCallback, useState } from 'react';
import dynamic from 'next/dynamic';
import { LoaderCircle, MapPin, Navigation, RotateCcw } from 'lucide-react';
import type { PickupPoint } from '@/data/pickup-points';
import { resolvePeruLocation, pickupDepartments } from '@/lib/peru-ubigeo';
import { checkoutCopy as copy } from '@/content/store';
import { formatPrice } from '@/lib/store/price';
import { Field, Select } from '@/components/store/StoreUI';
import { AgencyCard, directionsUrl, shippingLabel } from './AgencyCard';
import { AgencySearch } from './AgencySearch';

// MapLibre solo se descarga cuando el cliente elige recojo en provincias.
const AgencyMap = dynamic(() => import('./AgencyMap'), {
  ssr: false,
  loading: () => <div className="absolute inset-0 flex items-center justify-center gap-3 text-sm text-text-secondary">
    <LoaderCircle size={18} className="animate-spin motion-reduce:animate-none" aria-hidden="true" />{copy.mapLoading}
  </div>,
});

const cityLabel = (ubigeo: string) => {
  const city = resolvePeruLocation(ubigeo);
  return city ? (city.province === city.district ? city.district : `${city.province} · ${city.district}`) : ubigeo;
};
const isMetro = (ubigeo: string) => ubigeo.startsWith('1501') || ubigeo.startsWith('07');

/** Recojo en provincias: mapa de calles con las agencias Shalom y su tarifa, buscador, ficha y lista accesible de respaldo. */
export function ShalomPickupPicker({ catalog, department, onDepartment, pointId, onPoint }: {
  catalog: PickupPoint[]; department: string; onDepartment: (code: string) => void; pointId: string; onPoint: (id: string) => void;
}) {
  const [focus, setFocus] = useState('');
  const [mapless, setMapless] = useState(false);
  const agencies = catalog.filter(point => !isMetro(point.ubigeo));
  const counts = new Map<string, number>();
  const cheapest = new Map<string, number>();
  for (const point of agencies) {
    const code = point.ubigeo.slice(0, 2);
    counts.set(code, (counts.get(code) ?? 0) + 1);
    if (point.shipping_price != null) cheapest.set(code, Math.min(cheapest.get(code) ?? Infinity, Number(point.shipping_price)));
  }
  const departments = pickupDepartments.filter(item => counts.has(item.code)).map(item => ({ ...item, name: item.code === '15' ? copy.limaProvincesName : item.name }));
  const points = department ? agencies.filter(point => point.ubigeo.startsWith(department)) : [];
  const cities = [...new Set(points.map(point => point.ubigeo))].sort((a, b) => cityLabel(a).localeCompare(cityLabel(b), 'es'));
  const focused = agencies.find(point => point.id === focus);
  const chosen = agencies.find(point => point.id === pointId);
  const unsupported = useCallback(() => setMapless(true), []);

  // Elegir otro departamento borra la agencia elegida en el checkout; el mismo departamento no.
  function goDepartment(code: string) { if (code !== department) onDepartment(code); }
  function show(id: string) {
    const point = agencies.find(item => item.id === id);
    if (!point) return;
    goDepartment(point.ubigeo.slice(0, 2));
    setFocus(id);
  }
  function reset() { setFocus(''); onDepartment(''); }

  return <div className="@container">
    <p className="font-medium">{copy.mapTitle}</p>
    <p className="mt-2 text-sm leading-relaxed text-text-secondary">{mapless ? copy.mapUnavailable : copy.mapHint}</p>
    {mapless ? null : <div className="relative mt-5 h-[30rem] overflow-hidden border border-border-editorial bg-[#0f1a2c] @2xl:h-[36rem]">
      <AgencyMap points={agencies} counts={counts} department={department} focus={focus} selected={pointId}
        onDepartment={code => { setFocus(''); goDepartment(code); }} onFocus={show} onUnsupported={unsupported} />
      <div className="absolute left-3 right-14 top-3 z-30 max-w-sm">
        <AgencySearch points={agencies} onPick={point => show(point.id)} />
      </div>
      {department || focus ? <button type="button" onClick={reset}
        className="absolute bottom-8 right-3 z-10 flex min-h-11 items-center gap-2 border border-border-editorial bg-bg-darkest/95 px-3 text-sm text-text-primary backdrop-blur transition-colors hover:border-accent-cyan">
        <RotateCcw size={15} aria-hidden="true" />{copy.backToPeru}
      </button> : null}
      {focused ? <div className="absolute inset-x-0 bottom-0 z-20 flex max-h-[60%] flex-col @2xl:inset-x-auto @2xl:bottom-3 @2xl:left-3 @2xl:top-[4.5rem] @2xl:max-h-none @2xl:w-[22rem]">
        <AgencyCard point={focused} chosen={focused.id === pointId} onChoose={() => onPoint(focused.id)} onClose={() => setFocus('')} />
      </div> : null}
    </div>}
    {mapless ? null : <p className="mt-2 text-xs text-text-secondary">{copy.mapGestures}</p>}

    <div className="mt-6">
      <Field id="department" label={copy.mapFallback}>
        <Select id="department" value={department} onChange={event => { setFocus(''); onDepartment(event.target.value); }}>
          <option value="">{copy.selectDepartment}</option>
          {departments.map(item => <option key={item.code} value={item.code}>
            {item.name} · {counts.get(item.code)} {counts.get(item.code) === 1 ? copy.pointOne : copy.pointMany}{cheapest.has(item.code) ? ` · ${copy.from} ${formatPrice(cheapest.get(item.code)!)}` : ''}
          </option>)}
        </Select>
      </Field>
    </div>
    {department ? <fieldset className="mt-6 min-w-0">
      <legend className="font-medium">{copy.pickupPoint}</legend>
      <div className="mt-4 space-y-6">
        {cities.map(ubigeo => <div key={ubigeo}>
          <p className="mb-3 flex items-center gap-2 font-mono text-xs uppercase tracking-[0.14em] text-accent-cyan"><MapPin size={14} aria-hidden="true" />{cityLabel(ubigeo)}</p>
          <div className="space-y-3">{points.filter(point => point.ubigeo === ubigeo).map(point => {
            const selected = point.id === pointId;
            return <div key={point.id} className={`border transition-colors ${selected ? 'border-orange-400 bg-orange-400/5' : 'border-border-editorial hover:border-orange-400/60'}`}>
              <label className="flex cursor-pointer gap-4 p-4">
                <input type="radio" name="pickup-point" checked={selected} onChange={() => onPoint(point.id)} className="mt-1 h-5 w-5 shrink-0 accent-orange-400" />
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                    <strong className="min-w-0 font-medium break-words">{point.name}</strong>
                    <span className="text-sm tabular-nums text-orange-300">{shippingLabel(point)}</span>
                  </span>
                  <span className="mt-2 block text-sm break-words text-text-secondary">{point.street}</span>
                  <span className="mt-1 block text-sm break-words text-text-secondary">{point.reference}</span>
                  <span className="mt-1 block text-sm text-text-secondary">{point.hours}</span>
                </span>
              </label>
              <div className="flex flex-wrap border-t border-border-editorial">
                {!mapless && point.lat != null ? <button type="button" onClick={() => show(point.id)}
                  className="flex min-h-11 items-center gap-2 px-4 text-sm text-accent-cyan underline-offset-4 hover:underline">
                  <MapPin size={14} aria-hidden="true" />{copy.seeOnMap}<span className="sr-only"> {point.name}</span>
                </button> : null}
                <a href={directionsUrl(point)} target="_blank" rel="noopener noreferrer"
                  className="flex min-h-11 items-center gap-2 px-4 text-sm text-accent-cyan underline-offset-4 hover:underline">
                  <Navigation size={14} aria-hidden="true" />{copy.directions}<span className="sr-only"> {point.name}</span>
                </a>
              </div>
            </div>;
          })}</div>
        </div>)}
      </div>
    </fieldset> : null}
    {chosen ? <p role="status" className="mt-6 border border-orange-400/40 p-4 text-sm leading-relaxed">
      {copy.pickupChosen} <strong className="font-medium">{chosen.name}</strong>, {cityLabel(chosen.ubigeo)}. {copy.shippingTo}: <strong className="font-medium tabular-nums">{shippingLabel(chosen)}</strong>.
    </p> : null}
  </div>;
}

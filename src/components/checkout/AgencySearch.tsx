'use client';
import { useId, useState, type KeyboardEvent } from 'react';
import { Search, X } from 'lucide-react';
import type { PickupPoint } from '@/data/pickup-points';
import { resolvePeruLocation } from '@/lib/peru-ubigeo';
import { checkoutCopy as copy } from '@/content/store';
import { formatPrice } from '@/lib/store/price';

const plain = (text: string) => text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

/** Buscador tipo combobox: agencias por nombre, dirección, departamento, provincia o distrito, sin importar tildes. */
export function AgencySearch({ points, onPick }: { points: PickupPoint[]; onPick: (point: PickupPoint) => void }) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const list = useId();
  const words = plain(query).split(/\s+/).filter(Boolean);
  const results = words.length ? points.filter(point => {
    const city = resolvePeruLocation(point.ubigeo);
    const haystack = plain([point.name, point.street, city?.department, city?.province, city?.district].join(' '));
    return words.every(word => haystack.includes(word));
  }).slice(0, 8) : [];
  const pick = (point: PickupPoint) => { onPick(point); setOpen(false); setQuery(''); };
  const keys = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown') { event.preventDefault(); setOpen(true); setActive(value => Math.min(value + 1, results.length - 1)); }
    else if (event.key === 'ArrowUp') { event.preventDefault(); setActive(value => Math.max(value - 1, 0)); }
    else if (event.key === 'Enter' && results[active]) { event.preventDefault(); pick(results[active]); }
    else if (event.key === 'Escape') { event.stopPropagation(); setOpen(false); }
  };
  const showList = open && words.length > 0;
  return <div className="relative">
    <div className="flex min-h-12 items-center gap-2 border border-border-editorial bg-bg-darkest/95 px-3 shadow-[0_10px_30px_rgb(0_0_0/0.35)] backdrop-blur focus-within:border-accent-cyan">
      <Search size={17} className="shrink-0 text-text-secondary" aria-hidden="true" />
      <input type="search" role="combobox" aria-expanded={showList} aria-controls={list} aria-autocomplete="list" aria-label={copy.searchLabel}
        aria-activedescendant={showList && results[active] ? `${list}-${results[active].id}` : undefined}
        value={query} placeholder={copy.searchPlaceholder} autoComplete="off"
        onChange={event => { setQuery(event.target.value); setOpen(true); setActive(0); }} onFocus={() => setOpen(true)} onKeyDown={keys}
        className="min-w-0 flex-1 bg-transparent py-2 text-base text-text-primary placeholder:text-text-secondary focus:outline-none [&::-webkit-search-cancel-button]:hidden" />
      {query ? <button type="button" onClick={() => { setQuery(''); setOpen(false); }} aria-label={copy.searchClear}
        className="-mr-2 flex h-11 w-11 items-center justify-center text-text-secondary hover:text-text-primary"><X size={16} aria-hidden="true" /></button> : null}
    </div>
    {showList ? <ul id={list} role="listbox" aria-label={copy.searchLabel}
      className="absolute inset-x-0 top-full mt-1 max-h-72 overflow-y-auto border border-border-editorial bg-bg-darkest/98 shadow-[0_18px_40px_rgb(0_0_0/0.45)]">
      {results.length ? results.map((point, index) => {
        const city = resolvePeruLocation(point.ubigeo);
        return <li key={point.id} id={`${list}-${point.id}`} role="option" aria-selected={index === active}
          onMouseDown={event => { event.preventDefault(); pick(point); }} onMouseEnter={() => setActive(index)}
          className={`cursor-pointer border-b border-border-editorial px-4 py-3 last:border-b-0 ${index === active ? 'bg-accent-cyan/10' : ''}`}>
          <span className="flex items-baseline justify-between gap-3"><span className="min-w-0 font-medium break-words">{point.name}</span>
            {point.shipping_price != null ? <span className="shrink-0 text-sm tabular-nums text-orange-300">{formatPrice(Number(point.shipping_price))}</span> : null}</span>
          <span className="mt-0.5 block text-xs text-text-secondary">{city ? `${city.department} / ${city.province} / ${city.district}` : ''}</span>
        </li>;
      }) : <li className="px-4 py-3 text-sm text-text-secondary">{copy.searchEmpty}</li>}
    </ul> : null}
  </div>;
}

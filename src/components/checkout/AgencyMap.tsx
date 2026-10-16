'use client';
import { useEffect, useRef } from 'react';
import { LngLatBounds, Map as MapLibreMap, NavigationControl, getVersion, setWorkerUrl, type ExpressionSpecification, type GeoJSONSource, type SymbolLayerSpecification, type LngLatBoundsLike } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import type { PickupPoint } from '@/data/pickup-points';
import { checkoutCopy as copy } from '@/content/store';
import { formatPrice } from '@/lib/store/price';

// Un color por departamento, en la gama del mapa de referencia del usuario.
const colors: Record<string, string> = {
  '01': '#f2283c', '02': '#cddc1e', '03': '#20b2a8', '04': '#ff6eb0', '05': '#a94db5', '06': '#ff9800', '08': '#cddc1e',
  '09': '#f5a33a', '10': '#f6a43a', '11': '#9b4fb0', '12': '#1fb3a5', '13': '#ffd400', '14': '#ff9a3c', '15': '#0f87a8',
  '16': '#9ccc48', '17': '#ecb25c', '18': '#b5844a', '19': '#5a50b0', '20': '#ff7f2a', '21': '#f2448a', '22': '#f0388c',
  '23': '#9b4fb0', '24': '#f04a3a', '25': '#b84fb0',
};
// El worker lo copia scripts/copy-maplibre-worker.mjs en cada dev/build; la versión evita servir uno viejo en caché.
setWorkerUrl(`/maplibre/maplibre-gl-worker.mjs?v=${getVersion()}`);
const STYLE = 'https://tiles.openfreemap.org/styles/dark';
const PERU: LngLatBoundsLike = [[-81.4, -18.4], [-68.6, 0.1]];
// El estilo oscuro de OpenFreeMap llevado a la paleta navy del sitio.
const palette: [string, Parameters<MapLibreMap['setPaintProperty']>[1], string][] = [
  ['background', 'background-color', '#0f1a2c'], ['water', 'fill-color', '#0a2338'], ['waterway', 'line-color', '#0a2338'],
  ['landuse_residential', 'fill-color', '#132037'], ['landcover_wood', 'fill-color', '#12241f'], ['landuse_park', 'fill-color', '#12241f'],
  ['building', 'fill-color', '#18263f'], ['highway_minor', 'line-color', '#1d2c45'], ['highway_major_inner', 'line-color', '#253857'],
  ['highway_major_subtle', 'line-color', '#253857'], ['highway_motorway_subtle', 'line-color', '#2b4166'], ['boundary_state', 'line-color', '#33476a'],
  ['place_city', 'text-color', '#9fb0c8'], ['place_town', 'text-color', '#8ea0b9'], ['place_village', 'text-color', '#7f91aa'],
  ['place_suburb', 'text-color', '#7f91aa'], ['highway_name_other', 'text-color', '#6f8099'], ['highway_name_motorway', 'text-color', '#7f91aa'],
];
const spanish = {
  'NavigationControl.ZoomIn': 'Acercar', 'NavigationControl.ZoomOut': 'Alejar', 'NavigationControl.ResetBearing': 'Restablecer orientación',
  'AttributionControl.ToggleAttribution': 'Mostrar atribución', 'Map.Title': 'Mapa de agencias', 'Popup.Close': 'Cerrar',
  'CooperativeGesturesHandler.WindowsHelpText': 'Usa Ctrl + rueda del mouse para acercar o alejar el mapa',
  'CooperativeGesturesHandler.MacHelpText': 'Usa ⌘ + rueda del mouse para acercar o alejar el mapa',
  'CooperativeGesturesHandler.MobileHelpText': 'Usa dos dedos para mover el mapa',
};

/** Pin en forma de gota dibujado en canvas: cian por defecto, naranja si es el punto elegido. */
function pin(fill: string) {
  const ratio = 2, w = 34, h = 44;
  const canvas = document.createElement('canvas');
  canvas.width = w * ratio; canvas.height = h * ratio;
  const ctx = canvas.getContext('2d')!;
  ctx.scale(ratio, ratio);
  ctx.beginPath();
  ctx.moveTo(w / 2, h - 2);
  ctx.bezierCurveTo(w / 2 - 4, h - 12, 3, 24, 3, 16);
  ctx.arc(w / 2, 16, 14, Math.PI, 0);
  ctx.bezierCurveTo(w - 3, 24, w / 2 + 4, h - 12, w / 2, h - 2);
  ctx.closePath();
  ctx.fillStyle = fill; ctx.fill();
  ctx.lineWidth = 2.5; ctx.strokeStyle = '#f0ece4'; ctx.stroke();
  ctx.beginPath(); ctx.arc(w / 2, 16, 5.5, 0, Math.PI * 2); ctx.fillStyle = '#0d1828'; ctx.fill();
  return { width: canvas.width, height: canvas.height, data: new Uint8Array(ctx.getImageData(0, 0, canvas.width, canvas.height).data.buffer) };
}
const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
function bounds(geometry: GeoJSON.Geometry): LngLatBoundsLike {
  const box = new LngLatBounds();
  const walk = (value: unknown): void => {
    if (Array.isArray(value) && typeof value[0] === 'number') box.extend(value as [number, number]);
    else if (Array.isArray(value)) value.forEach(walk);
  };
  if ('coordinates' in geometry) walk(geometry.coordinates);
  return box;
}

/**
 * Mapa de calles (MapLibre + OpenFreeMap) con los departamentos coloreados en la vista país y un pin por agencia
 * en su ubicación exacta. Con cientos de agencias, los pines cercanos se agrupan en círculos con su conteo hasta
 * acercar; la agencia elegida queda siempre a la vista. El estado vive en el selector: este componente solo refleja
 * `department`, `focus` y `selected`.
 */
export default function AgencyMap({ points, counts, department, focus, selected, onDepartment, onFocus, onUnsupported }: {
  points: PickupPoint[]; counts: Map<string, number>; department: string; focus: string; selected: string;
  onDepartment: (code: string) => void; onFocus: (id: string) => void; onUnsupported: () => void;
}) {
  const container = useRef<HTMLDivElement>(null);
  const map = useRef<MapLibreMap | null>(null);
  const shapes = useRef<GeoJSON.FeatureCollection | null>(null);
  const ready = useRef(false);
  const pending = useRef(new Map<string, () => void>());
  // Los callbacks cambian en cada render; los eventos del mapa leen siempre la versión vigente.
  const handlers = useRef({ onDepartment, onFocus, onUnsupported, counts });
  useEffect(() => { handlers.current = { onDepartment, onFocus, onUnsupported, counts }; });
  /** Ejecuta ahora si el mapa ya cargó; si no, al terminar de cargar (solo la última orden de cada tipo importa). */
  const whenReady = (kind: string, task: () => void) => { if (ready.current) task(); else pending.current.set(kind, task); };

  /** Agencias con pin; la elegida va en su propia fuente para que ningún clúster la oculte. */
  const agencies = (chosen: boolean): GeoJSON.FeatureCollection => ({
    type: 'FeatureCollection',
    features: points.filter(point => point.lat != null && point.lng != null && (point.id === selected) === chosen).map(point => ({
      type: 'Feature', geometry: { type: 'Point', coordinates: [Number(point.lng), Number(point.lat)] },
      properties: { id: point.id, price: point.shipping_price != null ? formatPrice(Number(point.shipping_price)) : '' },
    })),
  });

  useEffect(() => {
    if (!container.current) return;
    let instance: MapLibreMap;
    try {
      instance = new MapLibreMap({
        container: container.current, style: STYLE, bounds: PERU, fitBoundsOptions: { padding: 24 },
        maxBounds: [[-92, -26], [-58, 6]], minZoom: 3.5, maxZoom: 18, cooperativeGestures: true,
        dragRotate: false, pitchWithRotate: false, touchPitch: false, renderWorldCopies: false,
        attributionControl: { compact: true }, locale: spanish,
      });
    } catch { handlers.current.onUnsupported(); return; }
    map.current = instance;
    instance.touchZoomRotate.disableRotation();
    instance.addControl(new NavigationControl({ showCompass: false }), 'top-right');
    instance.on('error', event => { if (!ready.current && /webgl/i.test(String(event.error?.message))) handlers.current.onUnsupported(); });
    instance.on('load', async () => {
      for (const [layer, property, value] of palette) if (instance.getLayer(layer)) instance.setPaintProperty(layer, property, value);
      // El estilo prioriza `name_en` («Department of Loreto»): nombres en español o el local de OpenStreetMap.
      for (const layer of instance.getStyle().layers) {
        if (layer.type === 'symbol' && layer.layout?.['text-field'] && layer.id !== 'highway_name_motorway') {
          instance.setLayoutProperty(layer.id, 'text-field', ['coalesce', ['get', 'name:es'], ['get', 'name']]);
        }
      }
      for (const [name, color] of [['pin', '#5bc2d8'], ['pin-chosen', '#ff9a3c']] as const) instance.addImage(name, pin(color), { pixelRatio: 2 });
      const response = await fetch('/maps/peru-departments.geojson');
      const geo = await response.json() as GeoJSON.FeatureCollection;
      // Cobertura en la propiedad del polígono: el color solo aparece donde hay agencias con retiro.
      for (const feature of geo.features) {
        const code = String(feature.properties?.code);
        feature.properties = { ...feature.properties, covered: handlers.current.counts.has(code) && code !== 'LM' && code !== '07', delivery: code === 'LM' || code === '07' };
      }
      shapes.current = geo;
      instance.addSource('departments', { type: 'geojson', data: geo, promoteId: 'code' });
      const firstLabel = instance.getStyle().layers.find(layer => layer.type === 'symbol')?.id;
      instance.addLayer({
        id: 'department-fill', type: 'fill', source: 'departments',
        paint: {
          'fill-color': ['case', ['get', 'covered'], ['match', ['get', 'code'], ...Object.entries(colors).flat(), '#5bc2d8'] as unknown as ExpressionSpecification, ['get', 'delivery'], '#3a4660', '#1d2638'],
          'fill-opacity': ['interpolate', ['linear'], ['zoom'], 5, ['case', ['boolean', ['feature-state', 'hover'], false], 0.78, 0.55], 8.5, 0],
        },
      }, firstLabel);
      instance.addLayer({
        id: 'department-line', type: 'line', source: 'departments',
        paint: { 'line-color': '#0d1828', 'line-width': ['interpolate', ['linear'], ['zoom'], 4, 0.8, 9, 1.6], 'line-opacity': ['interpolate', ['linear'], ['zoom'], 6, 1, 10, 0.35] },
      }, firstLabel);
      const empty: GeoJSON.FeatureCollection = { type: 'FeatureCollection', features: [] };
      const font = ['Noto Sans Regular'];
      const pinSize: ExpressionSpecification = ['interpolate', ['linear'], ['zoom'], 4, 0.55, 9, 0.8, 14, 1];
      // Precio bajo el pin al acercar: el cliente compara agencias de su ciudad sin abrir cada ficha.
      const priceLabel: SymbolLayerSpecification['layout'] = { 'text-field': ['get', 'price'], 'text-font': font, 'text-size': 12, 'text-anchor': 'top', 'text-offset': [0, 0.3], 'text-optional': true };
      instance.addSource('agencies', { type: 'geojson', data: empty, cluster: true, clusterRadius: 42, clusterMaxZoom: 11 });
      instance.addSource('chosen', { type: 'geojson', data: empty });
      instance.addLayer({
        id: 'agency-cluster', type: 'circle', source: 'agencies', filter: ['has', 'point_count'],
        paint: {
          'circle-color': '#0d1828', 'circle-stroke-color': '#5bc2d8', 'circle-stroke-width': 2, 'circle-opacity': 0.92,
          'circle-radius': ['step', ['get', 'point_count'], 15, 10, 19, 30, 24],
        },
      });
      instance.addLayer({
        id: 'agency-cluster-count', type: 'symbol', source: 'agencies', filter: ['has', 'point_count'],
        layout: { 'text-field': ['get', 'point_count_abbreviated'], 'text-font': font, 'text-size': 13, 'text-allow-overlap': true },
        paint: { 'text-color': '#f0ece4' },
      });
      instance.addLayer({
        id: 'agency-pin', type: 'symbol', source: 'agencies', filter: ['!', ['has', 'point_count']],
        layout: { 'icon-image': 'pin', 'icon-anchor': 'bottom', 'icon-allow-overlap': true, 'icon-size': pinSize, ...priceLabel },
        paint: { 'text-color': '#c9d4e3', 'text-halo-color': '#0d1828', 'text-halo-width': 1.5, 'text-opacity': ['step', ['zoom'], 0, 12, 1] },
      });
      instance.addLayer({
        id: 'agency-pin-chosen', type: 'symbol', source: 'chosen',
        layout: { 'icon-image': 'pin-chosen', 'icon-anchor': 'bottom', 'icon-allow-overlap': true, 'icon-size': pinSize, ...priceLabel, 'text-allow-overlap': true },
        paint: { 'text-color': '#ffb066', 'text-halo-color': '#0d1828', 'text-halo-width': 1.5 },
      });
      let hovered: string | number | undefined;
      instance.on('mousemove', 'department-fill', event => {
        const id = event.features?.[0]?.id;
        if (hovered !== undefined) instance.setFeatureState({ source: 'departments', id: hovered }, { hover: false });
        hovered = id;
        if (id !== undefined && instance.getZoom() < 8) instance.setFeatureState({ source: 'departments', id }, { hover: true });
        instance.getCanvas().style.cursor = event.features?.[0]?.properties?.covered && instance.getZoom() < 8 ? 'pointer' : '';
      });
      instance.on('mouseleave', 'department-fill', () => {
        if (hovered !== undefined) instance.setFeatureState({ source: 'departments', id: hovered }, { hover: false });
        hovered = undefined; instance.getCanvas().style.cursor = '';
      });
      for (const layer of ['agency-pin', 'agency-pin-chosen', 'agency-cluster']) {
        instance.on('mouseenter', layer, () => { instance.getCanvas().style.cursor = 'pointer'; });
        instance.on('mouseleave', layer, () => { instance.getCanvas().style.cursor = ''; });
      }
      instance.on('click', event => {
        const agency = instance.queryRenderedFeatures(event.point, { layers: ['agency-pin-chosen', 'agency-pin'] })[0];
        if (agency) { handlers.current.onFocus(String(agency.properties.id)); return; }
        const cluster = instance.queryRenderedFeatures(event.point, { layers: ['agency-cluster'] })[0];
        if (cluster && cluster.geometry.type === 'Point') {
          const center = cluster.geometry.coordinates as [number, number];
          (instance.getSource('agencies') as GeoJSONSource).getClusterExpansionZoom(Number(cluster.properties.cluster_id))
            .then(zoom => instance.easeTo({ center, zoom: zoom + 0.5, duration: reduced() ? 0 : 700 })).catch(() => {});
          return;
        }
        const area = instance.queryRenderedFeatures(event.point, { layers: ['department-fill'] })[0];
        if (area?.properties.covered && instance.getZoom() < 8) handlers.current.onDepartment(String(area.properties.code));
      });
      ready.current = true;
      for (const task of pending.current.values()) task();
      pending.current.clear();
    });
    const queue = pending.current;
    return () => { ready.current = false; queue.clear(); instance.remove(); map.current = null; };
  }, []);

  // Pines: se actualizan al cambiar el catálogo o el punto elegido.
  useEffect(() => {
    const instance = map.current;
    whenReady('pins', () => {
      (instance?.getSource('agencies') as GeoJSONSource | undefined)?.setData(agencies(false));
      (instance?.getSource('chosen') as GeoJSONSource | undefined)?.setData(agencies(true));
    });
  });

  // Cámara: agencia enfocada > departamento > Perú.
  useEffect(() => {
    const instance = map.current;
    if (!instance) return;
    const move = () => {
      const duration = reduced() ? 0 : undefined;
      const agency = points.find(point => point.id === focus && point.lat != null);
      if (agency) {
        // La ficha tapa la izquierda (pantalla ancha) o la mitad inferior (angosta): el pin se centra en el área libre.
        const { clientWidth: w, clientHeight: h } = instance.getContainer();
        const padding = w >= 672 ? { left: Math.min(380, w * 0.55), top: 0, right: 0, bottom: 0 } : { left: 0, top: 0, right: 0, bottom: h * 0.55 };
        instance.flyTo({ center: [Number(agency.lng), Number(agency.lat)], zoom: 15.5, padding, duration: duration ?? 1600, essential: false });
        return;
      }
      // flyTo deja fijo su padding: se limpia antes de encuadrar un departamento o el país.
      instance.setPadding({ top: 0, right: 0, bottom: 0, left: 0 });
      const area = shapes.current?.features.find(feature => feature.properties?.code === department);
      if (area) { instance.fitBounds(bounds(area.geometry), { padding: 48, duration: duration ?? 1100, maxZoom: 10 }); return; }
      instance.fitBounds(PERU, { padding: 24, duration: duration ?? 900 });
    };
    whenReady('camera', move);
  }, [department, focus, points]);

  // MapLibre impone `position: relative` a su contenedor (CSS sin capa, gana a Tailwind): el posicionamiento va en un envoltorio.
  return <div className="absolute inset-0" role="region" aria-label={copy.mapLabel}><div ref={container} className="h-full w-full" /></div>;
}

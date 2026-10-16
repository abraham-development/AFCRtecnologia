/** Utilidades compartidas por los scripts de puntos de recojo: texto, horarios y control de coordenadas por departamento. */
import { readFileSync } from 'node:fs';

export const plain = text => (text ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
export const slug = text => plain(text).replace(/ /g, '-');
export const sql = value => value == null ? 'null' : `'${String(value).replace(/'/g, "''")}'`;

const minutes = time => { const [h, m] = time.split(':').map(Number); return h * 60 + m; };
/** Une tramos solapados o contiguos: «09:00–18:00» y «14:00–18:00» es una sola jornada. */
export function ranges(...pairs) {
  const list = pairs.filter(([from, to]) => /^\d{2}:\d{2}$/.test(from ?? '') && /^\d{2}:\d{2}$/.test(to ?? '') && minutes(to) > minutes(from))
    .sort((a, b) => minutes(a[0]) - minutes(b[0]));
  const merged = [];
  for (const [from, to] of list) {
    const last = merged.at(-1);
    if (last && minutes(from) <= minutes(last[1])) { if (minutes(to) > minutes(last[1])) last[1] = to; }
    else merged.push([from, to]);
  }
  return merged;
}
const span = list => list.map(([from, to]) => `${from}–${to}`).join(' y ');
/** Texto de horario con el formato que muestran la ficha y la lista del checkout. */
export const hoursText = s => [`Lun–Vie ${s.weekdays.length ? span(s.weekdays) : 'cerrado'}`, `Sáb ${s.saturday.length ? span(s.saturday) : 'cerrado'}`,
  `Dom ${s.sunday.length ? span(s.sunday) : 'cerrado'}`].join(' · ');

const shapes = new Map(JSON.parse(readFileSync('public/maps/peru-departments.geojson', 'utf8')).features.map(f => [f.properties.code, f.geometry]));
function inRing(ring, [x, y]) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i], [xj, yj] = ring[j];
    if (yi > y !== yj > y && x < (xj - xi) * (y - yi) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}
/** Los transportistas publican algunas coordenadas erradas: se exige que caigan en su departamento, con ~3 km de margen por la costa simplificada. */
export function inDepartment(code, lng, lat) {
  if (!(lat > -18.6 && lat < 0.2 && lng > -81.5 && lng < -68.5)) return false;
  const geometry = shapes.get(code);
  if (!geometry) return false;
  const polygons = geometry.type === 'Polygon' ? [geometry.coordinates] : geometry.coordinates;
  const probes = [[0, 0], [0.03, 0], [-0.03, 0], [0, 0.03], [0, -0.03]].map(([dx, dy]) => [lng + dx, lat + dy]);
  return probes.some(spot => polygons.some(([outer, ...holes]) => inRing(outer, spot) && !holes.some(hole => inRing(hole, spot))));
}

/**
 * Completa ubicación exacta y horario de nuestros puntos Urbano con el localizador público de Urbano
 * (https://www.urbano.com.pe/urbano-points → api.urbanoenvios.pe/api/v1/getAgencies?type=2, provincias).
 *   node scripts/sync-urbano-agencies.mjs [agencias.json] > supabase/migrations/<versión>_urbano_points_sync.sql
 * Solo actualiza puntos que ya ofrecemos. Las agencias nuevas, cerradas o sin coincidencia se informan por stderr:
 * el usuario decide en /admin. El sitio nunca consulta la API de Urbano.
 */
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const API = 'https://api.urbanoenvios.pe/api/v1/getAgencies?type=2';
const plain = text => (text ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
const tokens = text => new Set(plain(text).split(' ').filter(word => word.length > 1 && !['agencia', 'tienda', 'urbano'].includes(word)));
const sql = value => value == null ? 'null' : `'${String(value).replace(/'/g, "''")}'`;
const log = message => process.stderr.write(`${message}\n`);

function query(text) {
  const result = spawnSync(path.resolve('node_modules/.bin/supabase'), ['db', 'query', '--linked', text], { encoding: 'utf8' });
  if (result.status !== 0) throw new Error(result.stderr || result.stdout);
  return JSON.parse(result.stdout.slice(result.stdout.indexOf('{'))).rows;
}

const minutes = time => { const [h, m] = time.split(':').map(Number); return h * 60 + m; };
/** Une tramos solapados o contiguos: «09:00–18:00» y «14:00–18:00» es una sola jornada. */
function ranges(...pairs) {
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
function schedule(row) {
  const days = row.dias_semana ?? '';
  const open = index => days[index] === 'S';
  return {
    weekdays: [0, 1, 2, 3, 4].every(open) ? ranges([row.manana_desde, row.manana_hasta], [row.tarde_desde, row.tarde_hasta]) : [],
    saturday: open(5) ? ranges([row.sabado_manana_desde, row.sabado_manana_hasta], [row.sabado_tarde_desde, row.sabado_tarde_hasta]) : [],
    sunday: open(6) ? ranges([row.domingo_desde, row.domingo_hasta]) : [],
  };
}
const span = list => list.map(([from, to]) => `${from}–${to}`).join(' y ');
const hoursText = s => [`Lun–Vie ${s.weekdays.length ? span(s.weekdays) : 'cerrado'}`, `Sáb ${s.saturday.length ? span(s.saturday) : 'cerrado'}`,
  `Dom ${s.sunday.length ? span(s.sunday) : 'cerrado'}`].join(' · ');
// Urbano publica algunas coordenadas erradas (p. ej. una agencia de Iquitos ubicada en Piura): se exige que caigan
// dentro de su departamento, con ~3 km de margen por la costa simplificada.
const shapes = new Map(JSON.parse(readFileSync('public/maps/peru-departments.geojson', 'utf8')).features.map(f => [f.properties.code, f.geometry]));
function inRing(ring, [x, y]) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i], [xj, yj] = ring[j];
    if (yi > y !== yj > y && x < (xj - xi) * (y - yi) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}
function inDepartment(code, lng, lat) {
  const geometry = shapes.get(code);
  if (!geometry) return false;
  const polygons = geometry.type === 'Polygon' ? [geometry.coordinates] : geometry.coordinates;
  const probes = [[0, 0], [0.03, 0], [-0.03, 0], [0, 0.03], [0, -0.03]].map(([dx, dy]) => [lng + dx, lat + dy]);
  return probes.some(spot => polygons.some(([outer, ...holes]) => inRing(outer, spot) && !holes.some(hole => inRing(hole, spot))));
}
const pickup = row => (Array.isArray(row.services) ? row.services : []).some(service => service.id_servicio === '2' && service.estado_servicio === '1');

const source = process.argv[2];
const agencies = source ? JSON.parse(readFileSync(source, 'utf8')).data : (await (await fetch(API)).json()).data;
if (!Array.isArray(agencies) || agencies.length < 50) throw new Error('Respuesta inesperada del localizador de Urbano');
const locations = new Map(JSON.parse(readFileSync('src/data/peru-locations.json', 'utf8')).map(([ubigeo, d, p, x]) => [ubigeo, plain(`${d} ${p} ${x}`)]));
const ours = query('select id,name,street,ubigeo,active from afcr_private.urbano_pickup_points order by id');

const city = row => plain(`${row.departamento} ${row.provincia} ${row.distrito}`);
/** Nombre exacto > dirección exacta > similitud de palabras (Jaccard), para no confundir «Abancay» con «Abancay II». */
function score(point, row) {
  if (plain(row.prov_descri) === plain(point.name)) return 3;
  if (plain(row.dir_calle) === plain(point.street)) return 2;
  const a = tokens(row.prov_descri), b = tokens(point.name);
  const shared = [...a].filter(word => b.has(word)).length;
  return shared / Math.max(1, new Set([...a, ...b]).size);
}
// Asignación voraz por mejor puntaje: cada fila de Urbano se usa una sola vez.
const pairs = [];
for (const point of ours) for (const row of agencies) {
  const sameCity = city(row) === locations.get(point.ubigeo);
  const value = score(point, row);
  // Fuera de su ciudad solo vale la misma dirección: Urbano a veces registra la ciudad de otra forma.
  if (sameCity ? value >= 0.5 : value === 2 || value === 3 && plain(row.dir_calle) === plain(point.street)) pairs.push({ point, row, value: value + (sameCity ? 0.1 : 0) });
}
pairs.sort((x, y) => y.value - x.value);
const used = new Set(), matched = new Map();
for (const { point, row } of pairs) {
  if (matched.has(point.id) || used.has(row)) continue;
  matched.set(point.id, row); used.add(row);
}
const updates = [];
for (const point of ours) {
  const row = matched.get(point.id);
  if (!row) {
    const moved = agencies.find(item => plain(item.prov_descri) === plain(point.name));
    log(moved ? `DIRECCIÓN DISTINTA EN URBANO  ${point.id}: nosotros «${point.street}», Urbano «${moved.dir_calle}» (${moved.ciudad})` : `SIN COINCIDENCIA  ${point.id} (${point.name})`);
    continue;
  }
  if (city(row) !== locations.get(point.ubigeo)) log(`CIUDAD DISTINTA EN URBANO  ${point.id}: ${row.ciudad} (misma dirección)`);
  if (!pickup(row)) log(`SIN RETIRO EN URBANO  ${point.id} (${point.name}) — revisar si se archiva`);
  const lat = Number(row.x), lng = Number(row.y);
  const valid = lat > -18.6 && lat < 0.2 && lng > -81.5 && lng < -68.5 && inDepartment(point.ubigeo.slice(0, 2), lng, lat);
  if (!valid) log(`COORDENADAS FUERA DE SU DEPARTAMENTO  ${point.id} (${lat}, ${lng}) — sin pin hasta corregirla en /admin`);
  const s = schedule(row);
  const coords = valid ? `lat=${lat.toFixed(6)},lng=${lng.toFixed(6)}` : 'lat=null,lng=null';
  updates.push(`update afcr_private.urbano_pickup_points set ${coords},urbano_code=${sql(row.prov_codigo)},`
    + `schedule=${sql(JSON.stringify(s))}::jsonb,hours=${sql(hoursText(s))},version=version+1 where id=${sql(point.id)};`);
}
for (const row of agencies) {
  // Lima Metropolitana y Callao son delivery: no se proponen como recojo.
  const metro = plain(row.departamento) === 'callao' || plain(row.departamento) === 'lima' && plain(row.provincia) === 'lima';
  if (pickup(row) && !used.has(row) && !metro)
    log(`NUEVA EN URBANO  ${row.prov_descri} · ${row.ciudad} · ${row.dir_calle}`);
}
process.stdout.write(`-- Ubicación exacta y horario de los puntos Urbano, del localizador público de Urbano (${new Date().toISOString().slice(0, 10)}).
-- Generado por scripts/sync-urbano-agencies.mjs. Solo puntos que ya ofrecemos; no crea ni archiva agencias.
${updates.join('\n')}
`);
log(`${updates.length} de ${ours.length} puntos con ubicación y horario`);

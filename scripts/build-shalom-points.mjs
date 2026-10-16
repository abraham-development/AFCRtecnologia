/**
 * Convierte la lista pública de agencias Shalom y su tarifario en la migración de puntos de recojo para provincias.
 *   node scripts/build-shalom-points.mjs recursos_internos/shalom-agencias-<fecha>.json recursos_internos/tarifas.pdf \
 *     > supabase/migrations/<versión>_shalom_points.sql
 * Agencias: copia de lo que muestra shalom.com.pe/agencias (el sitio nunca consulta a Shalom).
 * Tarifa: columna «PAQUETE MEDIANO» del PDF; terrestre si existe, aéreo solo si la agencia no tiene terrestre.
 * Solo agencias que reciben encomiendas (`destino`) fuera de Lima Metropolitana y Callao. Una agencia sin tarifa
 * queda inactiva hasta que /admin le ponga precio. Re-ejecutable: actualiza por id y archiva las que ya no figuran.
 */
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { hoursText, inDepartment, plain, ranges, slug, sql } from './lib/peru-geo.mjs';

const [source, ratesPdf] = process.argv.slice(2);
if (!source || !ratesPdf) throw new Error('Uso: node scripts/build-shalom-points.mjs <agencias.json> <tarifas.pdf>');
const log = message => process.stderr.write(`${message}\n`);

// --- Tarifario -------------------------------------------------------------------------------------------------
const pdf = spawnSync('pdftotext', ['-layout', ratesPdf, '-'], { encoding: 'utf8' });
if (pdf.status !== 0) throw new Error(`pdftotext falló: ${pdf.stderr}`);
const lines = pdf.stdout.split('\n');
const rates = { terrestre: new Map(), aereo: new Map() };
// Nombre largo: el PDF lo parte en una línea sobre la fila numerada y otra debajo.
const fragment = line => line && /^\s{3,}\S/.test(line) && !/^\s*(Nro|\d{4}-\d{2}-\d{2})/.test(line) && !/^\s*\d+\s/.test(line);
for (let i = 0; i < lines.length; i++) {
  const row = lines[i].match(/^\s*(\d+)\s+(\S.*?)?\s{2,}(\d+\.\d{2})\s+(\d+\.\d{2})\s+(\d+\.\d{2})\s+(\d+\.\d{2})\s*$/);
  if (!row) continue;
  let name = row[2]?.trim() ?? '';
  if (!name) {
    let up = i - 1; while (up >= 0 && !lines[up].trim()) up--;
    let down = i + 1; while (down < lines.length && !lines[down].trim()) down++;
    name = [fragment(lines[up]) ? lines[up].trim() : '', fragment(lines[down]) ? lines[down].trim() : ''].join(' ').trim();
  }
  if (!name) throw new Error(`Fila ${row[1]} del tarifario sin nombre`);
  const air = /-\s*AEREO$/i.test(name);
  const key = plain(name.replace(/-\s*AEREO$/i, ''));
  const price = Number(row[3]);
  if (!(price > 0)) throw new Error(`Fila ${row[1]} del tarifario sin precio`);
  rates[air ? 'aereo' : 'terrestre'].set(key, price);
}
log(`Tarifario: ${rates.terrestre.size} terrestres y ${rates.aereo.size} aéreas`);

// --- Agencias --------------------------------------------------------------------------------------------------
const agencies = JSON.parse(readFileSync(source, 'utf8')).data;
if (!Array.isArray(agencies) || agencies.length < 100) throw new Error('Lista de agencias Shalom inesperada');
const locations = new Map(JSON.parse(readFileSync('src/data/peru-locations.json', 'utf8')).map(([ubigeo, d, p, x]) => [ubigeo, { d, p, x }]));
const byNames = new Map([...locations].map(([ubigeo, l]) => [`${plain(l.d)}|${plain(l.p)}|${plain(l.x)}`, ubigeo]));
const metro = ubigeo => ubigeo.startsWith('1501') || ubigeo.startsWith('07');
// Coordenadas comprobadas a mano que el polígono simplificado deja fuera (Mazuko queda en el límite con Puno).
const verified = new Set(['299']);

const small = new Set(['de', 'del', 'la', 'las', 'los', 'el', 'y', 'e', 'con', 'en', 'a', 'al', 'por']);
const keepUpper = new Set(['co', 'smp', 'sjl', 'sjm', 'vmt', 'ves', 'ii', 'iii', 'iv', 'utp', 'upao', 'essalud', 'sn', 'mz', 'lt']);
/** «CHACHAPOYAS JR GRAU» → «Chachapoyas Jr Grau»; respeta siglas y tramos con números o barras. */
function title(text) {
  return (text ?? '').replace(/\s+/g, ' ').trim().toLowerCase().split(' ').map((word, index) => {
    const bare = word.replace(/[^\p{L}]/gu, '');
    if (/[\d/]/.test(word) && !/^\d+$/.test(word)) return word.toUpperCase();
    if (keepUpper.has(bare)) return word.toUpperCase();
    if (index > 0 && small.has(bare)) return word;
    return word.replace(/\p{L}/u, letter => letter.toUpperCase());
  }).join(' ');
}
/** «JR. X 270, REF. JUNTO A …» → calle y referencia. */
function address(text, location) {
  const value = (text ?? '').replace(/\s+/g, ' ').trim();
  const [street, reference] = value.split(/,?\s*(?:REFERENCIA|REF)\s*[.:]\s*/i);
  return { street: title(street.replace(/[,\s]+$/, '')) || title(location.x), reference: reference ? title(reference) : `${title(location.p)}, ${title(location.x)}` };
}
const hhmm = value => /^\d{2}:\d{2}/.test(value ?? '') ? value.slice(0, 5) : null;
function schedule(a) {
  const week = ranges([hhmm(a.horario_atencion_lunes_inicio), hhmm(a.horario_atencion_lunes_fin)]);
  return {
    weekdays: week,
    saturday: ranges([hhmm(a.horario_atencion_sabado_inicio), hhmm(a.horario_atencion_sabado_fin)]),
    sunday: ranges([hhmm(a.horario_atencion_domingo_inicio), hhmm(a.horario_atencion_domingo_fin)]),
  };
}

const rows = [];
const unpriced = [];
for (const a of agencies) {
  if (Number(a.destino) !== 1) continue;
  let ubigeo = String(a.ubi_id ?? '').padStart(6, '0');
  const district = String(a.lugar ?? '').split(' / ')[2] ?? '';
  const named = byNames.get(`${plain(a.departamento)}|${plain(a.provincia)}|${plain(district)}`);
  const location = locations.get(ubigeo);
  if (!location || plain(location.d) !== plain(a.departamento)) {
    if (!named) { log(`SIN UBIGEO  ${a.ter_id} ${a.nombre} (${a.lugar})`); continue; }
    ubigeo = named;
  }
  if (metro(ubigeo)) continue;
  const place = locations.get(ubigeo);
  const key = plain(a.nombre);
  const land = rates.terrestre.get(key), air = rates.aereo.get(key);
  const price = land ?? air ?? null;
  const mode = land != null ? 'terrestre' : air != null ? 'aereo' : null;
  if (price == null) unpriced.push(`${a.ter_id} ${a.nombre} (${a.departamento})`);
  const lat = Number(a.latitud), lng = Number(a.longitud);
  const department = ubigeo.slice(0, 2);
  const pinned = Number.isFinite(lat) && Number.isFinite(lng) && (verified.has(String(a.ter_id)) || inDepartment(department, lng, lat));
  if (!pinned) log(`COORDENADAS FUERA DE SU DEPARTAMENTO  ${a.ter_id} ${a.nombre} (${a.latitud}, ${a.longitud}) — sin pin hasta corregirla en /admin`);
  const s = schedule(a);
  const hours = s.weekdays.length || s.saturday.length || s.sunday.length ? hoursText(s)
    : (a.hora_atencion_web_lines ?? []).map(title).join(' · ') || 'Horario por confirmar';
  const { street, reference } = address(a.direccion, place);
  rows.push({
    id: `shalom-${a.ter_id}-${slug(a.nombre)}`.slice(0, 80).replace(/-+$/, ''), code: String(a.ter_id), name: title(a.nombre),
    street: street.slice(0, 250), reference: reference.slice(0, 250), hours: hours.slice(0, 200), ubigeo,
    lat: pinned ? lat.toFixed(6) : null, lng: pinned ? lng.toFixed(6) : null, schedule: JSON.stringify(s), price, mode,
  });
}
for (const item of unpriced) log(`SIN TARIFA (queda inactiva)  ${item}`);

const values = rows.map(r => ` (${[r.id, 'shalom', r.code, r.name, r.street, r.reference, r.hours, r.ubigeo].map(sql).join(',')},`
  + `${r.lat ?? 'null'},${r.lng ?? 'null'},${sql(r.schedule)}::jsonb,${r.price ?? 'null'},${sql(r.mode)},${r.price != null})`).join(',\n');
process.stdout.write(`-- Agencias Shalom de provincias con su tarifa de envío (agencias: shalom.com.pe/agencias; tarifario Shalom del 2026-10-12).
-- Generado por scripts/build-shalom-points.mjs. ${rows.length} agencias; ${unpriced.length} sin tarifa quedan inactivas.
-- Re-ejecutable: actualiza datos de Shalom, conserva coordenadas corregidas en /admin si Shalom no trae una válida
-- y la desactivación manual; archiva las agencias Shalom que ya no figuran.
insert into afcr_private.urbano_pickup_points(id,carrier,carrier_code,name,street,reference,hours,ubigeo,lat,lng,schedule,shipping_price,shipping_mode,active) values
${values}
on conflict(id) do update set carrier_code=excluded.carrier_code,name=excluded.name,street=excluded.street,reference=excluded.reference,
 hours=excluded.hours,ubigeo=excluded.ubigeo,schedule=excluded.schedule,
 lat=coalesce(excluded.lat,afcr_private.urbano_pickup_points.lat),lng=coalesce(excluded.lng,afcr_private.urbano_pickup_points.lng),
 shipping_price=coalesce(excluded.shipping_price,afcr_private.urbano_pickup_points.shipping_price),
 shipping_mode=coalesce(excluded.shipping_mode,afcr_private.urbano_pickup_points.shipping_mode),
 active=afcr_private.urbano_pickup_points.active and coalesce(excluded.shipping_price,afcr_private.urbano_pickup_points.shipping_price) is not null,
 version=afcr_private.urbano_pickup_points.version+1;
update afcr_private.urbano_pickup_points set active=false,version=version+1
 where carrier='shalom' and active and id not in (${rows.map(r => sql(r.id)).join(',')});
`);
const departments = new Map();
for (const r of rows) departments.set(r.ubigeo.slice(0, 2), (departments.get(r.ubigeo.slice(0, 2)) ?? 0) + 1);
log(`${rows.length} agencias en ${departments.size} departamentos · ${rows.filter(r => r.lat).length} con pin · ${rows.filter(r => r.mode === 'aereo').length} solo aéreas`);

/**
 * Convierte la lista de agencias Urbano entregada por el usuario en una migración de puntos de recojo.
 *   node scripts/build-urbano-points.mjs "recursos_internos/Departamentos Urbano.md" > supabase/migrations/<versión>_urbano_pickup_points.sql
 * Solo publica puntos con «Retiro en tienda»; los ubigeos salen de src/data/peru-locations.json.
 */
import { readFileSync } from 'node:fs';

const source = process.argv[2];
if (!source) throw new Error('Uso: node scripts/build-urbano-points.mjs <Departamentos Urbano.md>');
// Excluidos a pedido del usuario (2026-10-08): dirección inválida en la lista original.
const excluded = new Set(['JUNIN|HUANCAYO|HUANCAYO|Agencia Huancayo']);
const typos = { 'Pachac?tec': 'Pachacútec', 'ba?os': 'baños', 'Cajamrca': 'Cajamarca' };

const plain = text => text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
const slug = text => plain(text).replace(/ /g, '-');
const sql = text => `'${text.replace(/'/g, "''")}'`;
function repair(text) {
  let fixed = text;
  // Texto UTF-8 leído como Latin-1 una o dos veces («CaÃÂ±ete» → «Cañete»).
  for (let i = 0; i < 3 && /[ÃÂ]/.test(fixed); i++) fixed = Buffer.from(fixed, 'latin1').toString('utf8');
  for (const [wrong, right] of Object.entries(typos)) fixed = fixed.replaceAll(wrong, right);
  return fixed.replace(/\s+/g, ' ').trim();
}
const title = text => text === text.toUpperCase() && /[A-Z]{3}/.test(text)
  ? text.toLowerCase().replace(/(^|[\s(-])(\p{L})/gu, (_, a, b) => a + b.toUpperCase()) : text;

const locations = new Map(JSON.parse(readFileSync('src/data/peru-locations.json', 'utf8'))
  .map(([ubigeo, department, province, district]) => [`${plain(department)}|${plain(province)}|${plain(district)}`, { ubigeo, province, district }]));

const rows = [];
const ids = new Set();
for (const block of readFileSync(source, 'utf8').split(/\n####\s+/).slice(1)) {
  const [head, ...rest] = block.split('\n');
  const parts = head.split(' - ').map(part => part.trim());
  const location = locations.get(parts.map(plain).join('|'));
  if (parts.length !== 3 || !location) throw new Error(`Distrito sin ubigeo INEI: ${head}`);
  const lines = rest.map(line => line.trim());
  // Cada agencia empieza con su nombre seguido de una línea «2».
  const starts = lines.flatMap((line, i) => line === '2' && i > 0 ? [i] : []);
  starts.forEach((start, k) => {
    let n = start - 1;
    while (!lines[n]) n--;
    const name = title(repair(lines[n]));
    const segment = lines.slice(start + 1, starts[k + 1] ?? lines.length).filter(Boolean);
    if (!segment.includes('Retiro en tienda')) return;
    if (excluded.has(`${parts.map(p => plain(p).toUpperCase()).join('|')}|${name}`)) return;
    const closing = segment[0].match(/Cierra a las (\d{1,2}:\d{2})/)?.[1];
    const address = segment.slice(1, segment.indexOf('Recepción de Envíos')).map(repair);
    if (!closing || !address[0]) throw new Error(`Agencia incompleta: ${head} · ${name}`);
    let id = `urbano-${slug(`${parts[0]} ${parts[2]} ${name}`)}`.slice(0, 80).replace(/-+$/, '');
    for (let i = 2; ids.has(id); i++) id = `${id.slice(0, 76)}-${i}`;
    ids.add(id);
    rows.push({ id, name, street: address[0], reference: address[1] ?? `${location.province}, ${location.district}`, hours: `Atiende hasta las ${closing}`, ubigeo: location.ubigeo });
  });
}
const values = rows.map(r => ` (${[r.id, r.name, r.street, r.reference, r.hours, r.ubigeo].map(sql).join(',')},true)`).join(',\n');
process.stdout.write(`-- Puntos de recojo Urbano reales, de la lista entregada por el usuario (2026-10-08).
-- Generado por scripts/build-urbano-points.mjs: solo agencias con «Retiro en tienda». No pisa ediciones del panel.
insert into afcr_private.urbano_pickup_points(id,name,street,reference,hours,ubigeo,active) values
${values}
on conflict(id) do nothing;
`);
console.error(`${rows.length} puntos en ${new Set(rows.map(r => r.ubigeo.slice(0, 2))).size} departamentos`);

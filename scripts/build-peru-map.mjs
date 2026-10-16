/**
 * Genera public/maps/peru-departments.geojson: departamentos del Perú desde Natural Earth 1:10m admin-1
 * (dominio público), simplificados, para colorear la vista país del mapa de agencias.
 * Herramienta solo de desarrollo, instalada fuera del repo:
 *   npm install --prefix <tools> mapshaper@0.6
 *   MAP_TOOLS=<tools> node scripts/build-peru-map.mjs <ne_10m_admin_1_states_provinces.geojson>
 * Procedimiento y licencia: src/data/peru-departments-source.md
 */
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

const tools = process.env.MAP_TOOLS;
const source = process.argv[2];
if (!tools || !source) throw new Error('Uso: MAP_TOOLS=<dir> node scripts/build-peru-map.mjs <admin1.geojson>');

// Natural Earth separa Lima Metropolitana («Lima Province») de Lima Región; el checkout trata la primera y el Callao como delivery.
const codes = {
  Amazonas: '01', Áncash: '02', Apurímac: '03', Arequipa: '04', Ayacucho: '05', Cajamarca: '06', Callao: '07', Cusco: '08',
  Huancavelica: '09', Huánuco: '10', Ica: '11', Junín: '12', 'La Libertad': '13', Lambayeque: '14', Lima: '15', 'Lima Province': 'LM',
  Loreto: '16', 'Madre de Dios': '17', Moquegua: '18', Pasco: '19', Piura: '20', Puno: '21', 'San Martín': '22', Tacna: '23',
  Tumbes: '24', Ucayali: '25',
};
const names = { Lima: 'Lima (provincias)', 'Lima Province': 'Lima Metropolitana' };

const temp = mkdtempSync(path.join(tmpdir(), 'afcr-peru-map-'));
try {
  const raw = JSON.parse(readFileSync(source, 'utf8'));
  const features = raw.features.filter(f => f.properties.adm0_a3 === 'PER').map(f => {
    const code = codes[f.properties.name];
    if (!code) throw new Error(`Región sin código INEI: ${f.properties.name}`);
    return { type: 'Feature', properties: { code, name: names[f.properties.name] ?? f.properties.name }, geometry: f.geometry };
  });
  if (features.length !== 26) throw new Error(`Se esperaban 26 regiones de Perú y llegaron ${features.length}`);
  writeFileSync(path.join(temp, 'peru.json'), JSON.stringify({ type: 'FeatureCollection', features }));
  // Simplificación topológica: los límites compartidos siguen encajando sin huecos; orientación RFC 7946 para MapLibre.
  mkdirSync('public/maps', { recursive: true });
  const result = spawnSync(path.join(path.resolve(tools), 'node_modules/.bin/mapshaper'), [
    path.join(temp, 'peru.json'), '-simplify', 'visvalingam', '20%', 'keep-shapes', '-filter-islands', 'min-area=20km2',
    '-o', 'public/maps/peru-departments.geojson', 'format=geojson', 'precision=0.0001', 'rfc7946',
  ], { encoding: 'utf8' });
  if (result.status !== 0) throw new Error(result.stderr);
  console.log('public/maps/peru-departments.geojson escrito');
} finally { rmSync(temp, { recursive: true, force: true }); }

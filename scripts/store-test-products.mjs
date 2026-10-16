/**
 * Productos ficticios para probar compra y pago con Culqi en modo prueba.
 *   npm run store:test-products -- --insert   publica (o reactiva) los 4 productos [PRUEBA]
 *   npm run store:test-products -- --remove   los archiva; los pedidos de prueba conservan su historial
 * Se identifican por SKU `TEST-*`; nunca toca productos reales.
 */
import { spawnSync } from 'node:child_process';
import path from 'node:path';

const products = [
  ['TEST-MINIPC-01', '[PRUEBA] Mini PC Oficina', 'minipcs', 10],
  ['TEST-MINIPC-02', '[PRUEBA] Mini PC Pro', 'minipcs', 15],
  ['TEST-CAM-01', '[PRUEBA] Cámara IP interior', 'security-cameras', 5],
  ['TEST-CAM-02', '[PRUEBA] Cámara IP exterior', 'security-cameras', 8],
];
const description = 'Producto ficticio para probar el flujo de compra y pago. No se despacha ni se factura.';
const features = ['Producto de prueba', 'Paga con las tarjetas de prueba de Culqi'];
const quote = value => `'${String(value).replace(/'/g, "''")}'`;
const mode = process.argv[2];

let sql;
if (mode === '--insert') {
  const rows = products.map(([sku, name, category, price]) =>
    `(${quote(sku)},${quote(name)},'Producto de prueba',${quote(category)},${quote(description)},${quote(JSON.stringify(features))}::jsonb,${price},20,true)`).join(',\n');
  sql = `begin;
with saved as (
 insert into public.products(sku,name,brand,category,description,features,price,stock,active) values
 ${rows}
 on conflict(sku) do update set active=true,archived_at=null,updated_at=now(),version=public.products.version+1
 returning id,stock,(xmax=0) as created
), movements as (
 insert into afcr_private.store_stock_movements(product_id,delta,available_after,reason)
 select id,stock,stock,'initial_stock' from saved where created returning 1
)
select (select count(*) from saved) as productos,(select count(*) from movements) as nuevos;
commit;`;
} else if (mode === '--remove') {
  sql = `update public.products set active=false,archived_at=coalesce(archived_at,now()),updated_at=now(),version=version+1
where sku like 'TEST-%' and archived_at is null returning sku;`;
} else {
  console.error('Uso: npm run store:test-products -- --insert | --remove');
  process.exit(1);
}

const result = spawnSync(path.resolve('node_modules/.bin/supabase'), ['db', 'query', '--linked', sql], { encoding: 'utf8' });
if (result.status !== 0) {
  console.error(result.stderr || result.stdout);
  process.exit(1);
}
console.log(result.stdout.match(/"rows":\s*\[[\s\S]*?\]/)?.[0] ?? 'Listo.');

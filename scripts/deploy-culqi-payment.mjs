/** Publica el cobro con Culqi y su llave privada como secreto de Edge; nunca imprime credenciales. */
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import nextEnv from '@next/env';

nextEnv.loadEnvConfig(process.cwd(), true, { info() {}, error() {} });
const secret = process.env.CULQI_SECRET_KEY?.trim() ?? '';
const publicKey = process.env.NEXT_PUBLIC_CULQI_PUBLIC_KEY?.trim() ?? '';
if (!/^sk_(test|live)_[A-Za-z0-9]+$/.test(secret)) throw new Error('Añade CULQI_SECRET_KEY (sk_test_… o sk_live_…) a .env.local.');
// Llave pública y privada del mismo entorno: un token de prueba no se cobra con una llave live.
if (publicKey && publicKey.split('_')[1] !== secret.split('_')[1]) throw new Error('NEXT_PUBLIC_CULQI_PUBLIC_KEY y CULQI_SECRET_KEY son de entornos distintos.');
const temp = mkdtempSync(path.join(tmpdir(), 'afcr-culqi-deploy-'));
const env = { ...process.env };
if (!env.SUPABASE_ACCESS_TOKEN?.trim()) delete env.SUPABASE_ACCESS_TOKEN;
try {
  // Un directorio nuevo evita publicar un bundle previo del workdir de la CLI.
  mkdirSync(path.join(temp, 'supabase/functions/culqi-payment'), { recursive: true });
  writeFileSync(path.join(temp, 'supabase/config.toml'), 'project_id = "AFCRtecnologia-culqi-payment"\n');
  writeFileSync(path.join(temp, 'supabase/functions/culqi-payment/index.ts'), readFileSync('supabase/functions/culqi-payment/index.ts'));
  const file = path.join(temp, 'secrets.env');
  writeFileSync(file, `CULQI_SECRET_KEY=${secret}\n`, { mode: 0o600 });
  // Sin verificación JWT de la pasarela: el pago valida el bearer con getUser y el webhook relee todo en Culqi.
  for (const args of [['secrets', 'set', '--env-file', file], ['functions', 'deploy', 'culqi-payment', '--no-verify-jwt', '--use-api', '--workdir', temp]]) {
    const result = spawnSync(path.resolve('node_modules/.bin/supabase'), [...args, '--project-ref', 'zuqxtogggkundznzwulg'], { env, encoding: 'utf8' });
    // La salida de secretos puede cambiar de formato; no emitirla.
    if (result.status !== 0) throw new Error('La CLI no pudo publicar el cobro con Culqi.');
  }
  console.log('Cobro con Culqi publicado. Verifica el bundle remoto y prueba el endpoint antes de usarlo.');
} finally { rmSync(temp, { recursive: true, force: true }); }

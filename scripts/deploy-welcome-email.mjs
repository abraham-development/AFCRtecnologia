/** Publica solo la bienvenida; reutiliza el secreto SMTP existente en Edge. */
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import nextEnv from '@next/env';

nextEnv.loadEnvConfig(process.cwd(), true, { info() {}, error() {} });
const temp = mkdtempSync(path.join(tmpdir(), 'afcr-welcome-deploy-'));
const env = { ...process.env };
if (!env.SUPABASE_ACCESS_TOKEN?.trim()) delete env.SUPABASE_ACCESS_TOKEN;
try {
  const files = ['index.ts', 'worker.ts', 'template.ts', 'logo.ts'].map(name => `supabase/functions/welcome-email/${name}`);
  files.push('src/content/welcome.ts');
  for (const file of files) {
    const target = path.join(temp, file);
    mkdirSync(path.dirname(target), { recursive: true });
    writeFileSync(target, readFileSync(file));
  }
  writeFileSync(path.join(temp, 'supabase/config.toml'), 'project_id = "AFCRtecnologia-welcome-email"\n');
  // El handler valida un token privado de Vault antes de leer la cola o conectar a SMTP.
  const result = spawnSync(path.resolve('node_modules/.bin/supabase'), [
    'functions', 'deploy', 'welcome-email', '--no-verify-jwt', '--use-api', '--workdir', temp,
    '--project-ref', 'zuqxtogggkundznzwulg',
  ], { env, encoding: 'utf8' });
  if (result.status !== 0) throw new Error('No se pudo publicar la bienvenida.');
  console.log('Bienvenida publicada. Verifica el bundle remoto y el estado de la cola antes de activar Cron.');
} finally { rmSync(temp, { recursive: true, force: true }); }

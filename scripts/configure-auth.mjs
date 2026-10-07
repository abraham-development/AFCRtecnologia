/** Configura Auth por la CLI, leyendo secretos de .env.local sin imprimirlos. */
import { spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import nextEnv from '@next/env';
import ts from 'typescript';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
// El copy sigue en TypeScript; el script también funciona sin soporte nativo para .ts.
const copySource = ts.transpileModule(readFileSync(path.join(root, 'src/content/auth.ts'), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
}).outputText;
const { authCopy } = await import(`data:text/javascript;base64,${Buffer.from(copySource).toString('base64')}`);
nextEnv.loadEnvConfig(root, true, { info() {}, error() {} });
const mode = process.argv[2] ?? '--diff';
if (!['--check', '--diff', '--apply', '--verify'].includes(mode)) {
  console.error('Usa --check, --diff, --apply o --verify.');
  process.exit(1);
}
const required = ['NEXT_PUBLIC_SUPABASE_URL', 'AUTH_SITE_URL', 'AUTH_REDIRECT_URLS', 'HOSTINGER_SMTP_HOST', 'HOSTINGER_SMTP_PORT', 'HOSTINGER_SMTP_USER', 'HOSTINGER_SMTP_PASSWORD', 'AUTH_EMAIL_FROM', 'AUTH_EMAIL_SENDER_NAME'];
const missing = required.filter(name => !process.env[name]?.trim());
if (missing.length) { console.error(`Completa en .env.local: ${missing.join(', ')}`); process.exit(1); }
const ref = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname.split('.')[0];
const linked = readFileSync(path.join(root, 'supabase/.temp/project-ref'), 'utf8').trim();
if (ref !== 'zuqxtogggkundznzwulg' || linked !== ref) {
  console.error('El proyecto vinculado no coincide con el proyecto autorizado.'); process.exit(1);
}
const googleId = process.env.GOOGLE_OAUTH_CLIENT_ID?.trim();
const googleSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET?.trim();
if (Boolean(googleId) !== Boolean(googleSecret)) {
  console.error('Completa tanto GOOGLE_OAUTH_CLIENT_ID como GOOGLE_OAUTH_CLIENT_SECRET.'); process.exit(1);
}
const port = Number(process.env.HOSTINGER_SMTP_PORT);
if (![465, 587].includes(port)) { console.error('HOSTINGER_SMTP_PORT debe ser 465 o 587.'); process.exit(1); }
const redirects = process.env.AUTH_REDIRECT_URLS.split(',').map(value => value.trim()).filter(Boolean);
for (const value of [process.env.AUTH_SITE_URL, ...redirects]) {
  const url = new URL(value);
  if (url.protocol !== 'https:' && !(['localhost', '127.0.0.1'].includes(url.hostname) && url.protocol === 'http:')) {
    console.error('Las URLs deben usar HTTPS; HTTP solo se permite en desarrollo local.'); process.exit(1);
  }
}
if (mode === '--check') {
  console.log(`Configuración lista. Google: ${googleId ? 'incluido' : 'pendiente de credenciales'}. La CLI usa su sesión guardada o un token no vacío.`);
  process.exit(0);
}

const temporary = mkdtempSync(path.join(tmpdir(), 'afcr-auth-config-'));
const cliEnv = { ...process.env };
// Un campo vacío en .env.local no debe ocultar la sesión de supabase login.
if (!cliEnv.SUPABASE_ACCESS_TOKEN?.trim()) delete cliEnv.SUPABASE_ACCESS_TOKEN;
const secrets = [process.env.HOSTINGER_SMTP_PASSWORD, googleSecret, cliEnv.SUPABASE_ACCESS_TOKEN].filter(Boolean);
function redact(value) {
  let result = value;
  for (const secret of secrets) {
    result = result.split(secret).join('[oculto]');
    result = result.split(JSON.stringify(secret).slice(1, -1)).join('[oculto]');
  }
  return result;
}
const escape = value => value.replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
const email = authCopy.emailMessage;
const html = `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head><body style="margin:0;background:#0d1828;color:#f0ece4;font-family:Arial,sans-serif;padding:32px 20px"><div style="max-width:480px;margin:auto"><p style="font-size:14px;color:#5bc2d8">AFCRtecnologia</p><h1 style="font-size:26px;font-weight:400">${escape(email.title)}</h1><p style="line-height:1.6">${escape(email.body)}</p><p style="font-family:monospace;font-size:32px;letter-spacing:6px;padding:24px 0;border-top:1px solid #243049;border-bottom:1px solid #243049">{{ .Token }}</p><p style="line-height:1.6">${escape(email.expiry)}</p><p style="font-size:14px;line-height:1.6">${escape(email.security)}</p></div></body></html>`;
try {
  mkdirSync(path.join(temporary, 'supabase'));
  writeFileSync(path.join(temporary, 'otp.html'), html);
  const config = [
    'project_id = "AFCRtecnologia-auth"',
    '[auth]',
    'enabled = true',
    `site_url = ${JSON.stringify(process.env.AUTH_SITE_URL)}`,
    `additional_redirect_urls = ${JSON.stringify(redirects)}`,
    'minimum_password_length = 12',
    'enable_manual_linking = true',
    'password_requirements = "lower_upper_letters_digits"',
    '[auth.email]',
    'enable_signup = true',
    'enable_confirmations = true',
    'max_frequency = "60s"',
    'otp_length = 6',
    'otp_expiry = 600',
    '[auth.email.smtp]',
    'enabled = true',
    'host = "env(HOSTINGER_SMTP_HOST)"',
    `port = ${port}`,
    'user = "env(HOSTINGER_SMTP_USER)"',
    'pass = "env(HOSTINGER_SMTP_PASSWORD)"',
    'admin_email = "env(AUTH_EMAIL_FROM)"',
    'sender_name = "env(AUTH_EMAIL_SENDER_NAME)"',
    '[auth.hook.custom_access_token]',
    'enabled = true',
    'uri = "pg-functions://postgres/afcr_private/enforce_auth_method"',
  ];
  for (const [name, subject] of Object.entries(email.subjects)) {
    config.push(`[auth.email.template.${name}]`, `subject = ${JSON.stringify(subject)}`, 'content_path = "./otp.html"');
  }
  if (googleId) config.push('[auth.external.google]', 'enabled = true', 'client_id = "env(GOOGLE_OAUTH_CLIENT_ID)"', 'secret = "env(GOOGLE_OAUTH_CLIENT_SECRET)"');
  writeFileSync(path.join(temporary, 'supabase/config.toml'), `${config.join('\n')}\n`);
  const args = ['config', mode === '--apply' ? 'push' : 'diff', '--project-ref', ref, '--workdir', temporary, '--output-format', 'json'];
  if (mode === '--apply') args.push('--yes');
  function run(cliArgs, print = true) {
    const result = spawnSync(path.join(root, 'node_modules/.bin/supabase'), cliArgs, { cwd: root, env: cliEnv, encoding: 'utf8', maxBuffer: 8 * 1024 * 1024 });
    if (print && result.stdout) console.log(redact(result.stdout).trim());
    if (print && result.stderr) console.error(redact(result.stderr).trim());
    if (result.error || result.status !== 0) {
      if (!print && result.stdout) console.error(redact(result.stdout).trim());
      if (!print && result.stderr) console.error(redact(result.stderr).trim());
      throw new Error('La CLI no pudo completar la operación.');
    }
    return result.stdout;
  }
  function declaredChanges(stdout) {
    const diff = JSON.parse(stdout);
    if (!Array.isArray(diff.changes) || diff.target?.project_ref !== ref) throw new Error('La CLI devolvió una comparación inesperada.');
    return diff.changes.filter(change => change.declared === true);
  }
  if (mode === '--apply') {
    const changes = declaredChanges(run(['config', 'diff', '--project-ref', ref, '--workdir', temporary, '--output-format', 'json'], false));
    if (changes.some(change => change.path[0] !== 'auth')) throw new Error('Se rechazó un cambio fuera de Auth.');
    console.log(`Aplicando ${changes.length} ajustes declarados de Auth.`);
    run(args);
  } else if (mode === '--verify') {
    const changes = declaredChanges(run(args, false));
    if (changes.length) throw new Error(`Quedan ${changes.length} ajustes declarados por sincronizar.`);
    console.log('Ajustes declarados de Auth verificados. La API oculta la contraseña SMTP; el envío real debe probarse aparte.');
  } else run(args);
} catch (issue) {
  console.error(redact(issue.message));
  process.exitCode = 1;
} finally { rmSync(temporary, { recursive: true, force: true }); }

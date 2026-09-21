/**
 * Empaqueta `out/` en un ZIP listo para subir a public_html en Hostinger.
 *
 * Se ejecuta después de `next build` con BUILD_TARGET=static:
 *   npm run package:static
 *
 * Next copia `public/` al export, pero comprobamos explícitamente los dos
 * archivos que no pueden faltar (`.htaccess` y `contact.php`) y los copiamos
 * si hiciera falta: sin ellos el sitio pierde cabeceras y formulario.
 */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const out = path.join(root, 'out');
const zipName = 'afcrtecnologia-hostinger.zip';
const zipPath = path.join(root, zipName);

if (!fs.existsSync(out)) {
  console.error('No existe out/. Ejecuta primero: npm run build:static');
  process.exit(1);
}

// Garantiza que los archivos críticos de `public/` llegaron al export.
for (const file of ['.htaccess', 'contact.php']) {
  const target = path.join(out, file);
  if (!fs.existsSync(target)) {
    const source = path.join(root, 'public', file);
    if (!fs.existsSync(source)) {
      console.error(`Falta public/${file}`);
      process.exit(1);
    }
    fs.copyFileSync(source, target);
    console.log(`· ${file} copiado manualmente al export`);
  }
}

// Archivos que no deben publicarse.
for (const junk of ['.DS_Store']) {
  const target = path.join(out, junk);
  if (fs.existsSync(target)) fs.rmSync(target, { force: true });
}

fs.rmSync(zipPath, { force: true });
// `-r .` incluye los archivos ocultos, .htaccess entre ellos.
execFileSync('zip', ['-r', '-q', zipPath, '.'], { cwd: out });

const count = (dir) =>
  fs.readdirSync(dir, { withFileTypes: true }).reduce(
    (total, entry) =>
      total + (entry.isDirectory() ? count(path.join(dir, entry.name)) : 1),
    0,
  );

const size = (fs.statSync(zipPath).size / 1024 / 1024).toFixed(2);
console.log(`\n${zipName} · ${size} MB · ${count(out)} archivos`);
console.log('Sube su CONTENIDO (no la carpeta) a public_html en hPanel.');

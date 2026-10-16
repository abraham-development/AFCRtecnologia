/**
 * MapLibre 6 carga su Web Worker como módulo hermano de su propio archivo; dentro del bundle de Next ese
 * archivo no existe. Se copia a public/ antes de cada dev/build (también en Hostinger) desde la versión instalada.
 */
import { copyFileSync, mkdirSync } from 'node:fs';

mkdirSync('public/maplibre', { recursive: true });
copyFileSync('node_modules/maplibre-gl/dist/maplibre-gl-worker.mjs', 'public/maplibre/maplibre-gl-worker.mjs');

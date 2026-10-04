/**
 * Conteo 00 -> 100 de la cortina de carga, como script en linea.
 * ---------------------------------------------------------------
 * Corre en cuanto el HTML llega, antes que los paquetes de React. Si el conteo
 * dependiera de la hidratacion, en un telefono la cortina se quedaba en «00»
 * congelado 2-3 s y luego se abria de golpe. Aqui el conteo avanza por
 * cuadros pintados (cada uno suma como mucho MAX_STEP ms), asi un bloqueo de
 * carga lo pausa pero nunca lo hace saltar. Al llegar a 100 lo sostiene un
 * instante y avisa con PRELOAD_DONE_EVENT; `Preloader` abre la cortina.
 */

export const PRELOADER_ID = 'afcr-preloader';
export const PRELOAD_DONE_EVENT = 'afcr:preload-done';

/** Duracion del conteo en ms de cuadros pintados. */
const DURATION = 1400;
/** Lo maximo que un cuadro puede adelantar el conteo (ms). */
const MAX_STEP = 50;
/** Pausa con el 100 en pantalla antes de avisar (ms). */
const HOLD_AT_100 = 120;

export const PRELOADER_SCRIPT = `(function () {
  var root = document.getElementById('${PRELOADER_ID}');
  var state = (window.__afcrPreload = { done: false });
  function finish() {
    state.done = true;
    window.dispatchEvent(new Event('${PRELOAD_DONE_EVENT}'));
  }
  if (!root) return finish();
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    root.style.display = 'none';
    return finish();
  }
  var count = root.querySelector('[data-preload-count]');
  var bar = root.querySelector('[data-preload-bar]');
  var elapsed = 0;
  var prev = null;
  document.body.style.overflow = 'hidden';
  function tick(now) {
    if (prev !== null) elapsed += Math.min(now - prev, ${MAX_STEP});
    prev = now;
    var raw = Math.min(1, elapsed / ${DURATION});
    var value = Math.round((1 - Math.pow(1 - raw, 3)) * 100);
    if (count) count.textContent = value < 10 ? '0' + value : String(value);
    if (bar) bar.style.transform = 'scaleX(' + value / 100 + ')';
    if (raw < 1) return requestAnimationFrame(tick);
    setTimeout(finish, ${HOLD_AT_100});
  }
  requestAnimationFrame(tick);
})();`;

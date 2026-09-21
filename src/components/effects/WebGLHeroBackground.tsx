'use client';

import { useEffect, useRef } from 'react';
import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Mesh,
  PerspectiveCamera,
  PlaneGeometry,
  Points,
  Scene,
  ShaderMaterial,
  Vector2,
  Vector3,
  WebGLRenderer,
} from 'three';

import { cn, lerp, supportsWebGL } from '@/lib/utils';

/* -------------------------------------------------------------------------- */
/*  Shaders                                                                    */
/* -------------------------------------------------------------------------- */

const PARTICLE_VERTEX = /* glsl */ `
  uniform float uTime;
  uniform vec2 uMouse;
  uniform float uSize;
  uniform float uPixelRatio;

  attribute float aScale;
  attribute float aSpeed;
  attribute vec3 aPhase;

  varying float vDepth;

  void main() {
    vec3 p = position;
    float t = uTime * aSpeed;

    // Deriva organica: tres senoidales desfasadas por particula
    p.x += sin(t + aPhase.x) * 0.55;
    p.y += cos(t * 0.9 + aPhase.y) * 0.42;
    p.z += sin(t * 0.7 + aPhase.z) * 0.38;

    // Paralaje: las capas cercanas responden mas al puntero
    float depth = clamp((p.z + 7.0) / 14.0, 0.0, 1.0);
    p.xy += uMouse * (0.35 + depth * 1.25);

    vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    gl_PointSize = uSize * aScale * uPixelRatio * (10.0 / max(-mvPosition.z, 0.001));

    vDepth = depth;
  }
`;

const PARTICLE_FRAGMENT = /* glsl */ `
  precision mediump float;

  uniform vec3 uColorNear;
  uniform vec3 uColorFar;

  varying float vDepth;

  void main() {
    vec2 uv = gl_PointCoord - 0.5;
    float d = length(uv);
    if (d > 0.5) discard;

    float core = smoothstep(0.5, 0.0, d);
    float alpha = core * (0.10 + vDepth * 0.55);

    vec3 color = mix(uColorFar, uColorNear, pow(vDepth, 1.4));
    gl_FragColor = vec4(color, alpha);
  }
`;

const FOG_VERTEX = /* glsl */ `
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const FOG_FRAGMENT = /* glsl */ `
  precision mediump float;

  uniform float uTime;
  uniform vec2 uMouse;
  uniform vec3 uCyan;
  uniform vec3 uDeep;

  varying vec2 vUv;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
  }

  float valueNoise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);

    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));

    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
  }

  float fbm(vec2 p) {
    float value = 0.0;
    float amplitude = 0.5;
    for (int i = 0; i < 3; i++) {
      value += amplitude * valueNoise(p);
      p *= 2.03;
      amplitude *= 0.5;
    }
    return value;
  }

  void main() {
    vec2 uv = vUv;
    vec2 p = uv * 2.6 + uMouse * 0.12;
    float t = uTime * 0.03;

    float n = fbm(p + vec2(t, -t * 0.55));
    float n2 = fbm(p * 1.7 - vec2(t * 0.7, t * 0.25));
    float mask = smoothstep(0.30, 0.92, n * 0.72 + n2 * 0.46);

    // Halo cian desplazado del centro, como una fuente de luz fria
    float halo = smoothstep(0.78, 0.0, distance(uv, vec2(0.27, 0.68)));
    float vignette = 1.0 - smoothstep(0.35, 1.0, distance(uv, vec2(0.5)));

    vec3 color = mix(uDeep, uCyan, clamp(mask * 0.5 + halo * 0.45, 0.0, 1.0));
    float alpha = (mask * 0.34 + halo * 0.26) * vignette;

    gl_FragColor = vec4(color, clamp(alpha, 0.0, 1.0));
  }
`;

/* -------------------------------------------------------------------------- */
/*  Utilidades                                                                 */
/* -------------------------------------------------------------------------- */

/** Hex sRGB -> vec3 crudo (evitamos la gestion de color de three). */
function rgb(hex: number): Vector3 {
  return new Vector3(((hex >> 16) & 255) / 255, ((hex >> 8) & 255) / 255, (hex & 255) / 255);
}

interface WebGLHeroBackgroundProps {
  className?: string;
}

/**
 * Nube de datos WebGL: campo de particulas con paralaje + niebla fbm.
 *
 * - Se pausa con `document.hidden` y fuera del viewport.
 * - Degrada la calidad sola si el dispositivo no sostiene 40 FPS.
 * - Si WebGL falla, queda el degradado CSS + grano del contenedor.
 */
export function WebGLHeroBackground({ className }: WebGLHeroBackgroundProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    /** El degradado CSS ya esta pintado: solo marcamos el modo para depurar. */
    const markFallback = () => {
      container.dataset.webgl = 'fallback';
    };

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced || !supportsWebGL()) {
      markFallback();
      return;
    }

    const isMobile = window.matchMedia('(max-width: 768px)').matches;
    const canvas = document.createElement('canvas');
    canvas.className = 'block h-full w-full';

    let renderer: WebGLRenderer;
    try {
      renderer = new WebGLRenderer({
        canvas,
        alpha: true,
        antialias: false,
        powerPreference: 'high-performance',
      });
    } catch {
      markFallback();
      return;
    }

    const maxDpr = isMobile ? 1 : 1.5;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, maxDpr));
    renderer.setClearColor(0x000000, 0);
    container.appendChild(canvas);
    container.dataset.webgl = 'active';

    const scene = new Scene();
    const camera = new PerspectiveCamera(55, 1, 0.1, 100);
    camera.position.z = 9;

    /* ----- Niebla de fondo ------------------------------------------------ */
    const fogMaterial = new ShaderMaterial({
      vertexShader: FOG_VERTEX,
      fragmentShader: FOG_FRAGMENT,
      transparent: true,
      depthWrite: false,
      uniforms: {
        uTime: { value: 0 },
        uMouse: { value: new Vector2(0, 0) },
        uCyan: { value: rgb(0x5bc2d8) },
        uDeep: { value: rgb(0x101b2d) },
      },
    });

    const fogGeometry = new PlaneGeometry(1, 1);
    const fog = new Mesh(fogGeometry, fogMaterial);
    fog.position.z = -6;
    scene.add(fog);

    /* ----- Campo de particulas -------------------------------------------- */
    const count = isMobile ? 1100 : 2600;
    const positions = new Float32Array(count * 3);
    const scales = new Float32Array(count);
    const speeds = new Float32Array(count);
    const phases = new Float32Array(count * 3);

    for (let i = 0; i < count; i += 1) {
      positions[i * 3] = (Math.random() - 0.5) * 30;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 17;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 13;

      scales[i] = 0.35 + Math.random() * 1.45;
      speeds[i] = 0.06 + Math.random() * 0.3;

      phases[i * 3] = Math.random() * Math.PI * 2;
      phases[i * 3 + 1] = Math.random() * Math.PI * 2;
      phases[i * 3 + 2] = Math.random() * Math.PI * 2;
    }

    const particleGeometry = new BufferGeometry();
    particleGeometry.setAttribute('position', new BufferAttribute(positions, 3));
    particleGeometry.setAttribute('aScale', new BufferAttribute(scales, 1));
    particleGeometry.setAttribute('aSpeed', new BufferAttribute(speeds, 1));
    particleGeometry.setAttribute('aPhase', new BufferAttribute(phases, 3));

    const particleMaterial = new ShaderMaterial({
      vertexShader: PARTICLE_VERTEX,
      fragmentShader: PARTICLE_FRAGMENT,
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
      uniforms: {
        uTime: { value: 0 },
        uMouse: { value: new Vector2(0, 0) },
        uSize: { value: isMobile ? 2.4 : 3.1 },
        uPixelRatio: { value: renderer.getPixelRatio() },
        uColorNear: { value: rgb(0x5bc2d8) },
        uColorFar: { value: rgb(0x2c4a70) },
      },
    });

    const particles = new Points(particleGeometry, particleMaterial);
    scene.add(particles);

    /* ----- Dimensionado --------------------------------------------------- */
    const resize = () => {
      const { clientWidth, clientHeight } = container;
      if (!clientWidth || !clientHeight) return;

      camera.aspect = clientWidth / clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(clientWidth, clientHeight, false);
      particleMaterial.uniforms.uPixelRatio!.value = renderer.getPixelRatio();

      // La niebla cubre exactamente el frustum a su profundidad
      const distance = camera.position.z - fog.position.z;
      const height = 2 * Math.tan((camera.fov * Math.PI) / 360) * distance;
      fog.scale.set(height * camera.aspect * 1.05, height * 1.05, 1);
    };

    resize();
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(container);

    /* ----- Puntero -------------------------------------------------------- */
    const pointer = { x: 0, y: 0 };
    const smoothed = { x: 0, y: 0 };

    const onPointerMove = (event: PointerEvent) => {
      pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
      pointer.y = -((event.clientY / window.innerHeight) * 2 - 1);
    };
    window.addEventListener('pointermove', onPointerMove, { passive: true });

    /* ----- Bucle ---------------------------------------------------------- */
    let frame = 0;
    let elapsed = 0;
    let last = performance.now();
    let sampled = 0;
    let accumulated = 0;
    let quality = 2;
    let inView = true;

    const render = (now: number) => {
      const delta = Math.min((now - last) / 1000, 0.05);
      last = now;
      elapsed += delta;

      smoothed.x = lerp(smoothed.x, pointer.x, 0.045);
      smoothed.y = lerp(smoothed.y, pointer.y, 0.045);

      particleMaterial.uniforms.uTime!.value = elapsed;
      (particleMaterial.uniforms.uMouse!.value as Vector2).set(smoothed.x, smoothed.y);
      fogMaterial.uniforms.uTime!.value = elapsed;
      (fogMaterial.uniforms.uMouse!.value as Vector2).set(smoothed.x, smoothed.y);

      renderer.render(scene, camera);

      // Vigilancia de rendimiento: degradamos antes de que se note
      if (quality > 0) {
        sampled += 1;
        accumulated += delta * 1000;
        if (sampled >= 90) {
          const average = accumulated / sampled;
          if (average > 26) {
            quality -= 1;
            if (quality === 1) fog.visible = false;
            if (quality === 0) particleGeometry.setDrawRange(0, Math.floor(count / 2));
          } else {
            quality = 0;
          }
          sampled = 0;
          accumulated = 0;
        }
      }

      frame = requestAnimationFrame(render);
    };

    const start = () => {
      if (frame || !inView || document.hidden) return;
      last = performance.now();
      frame = requestAnimationFrame(render);
    };

    const stop = () => {
      if (!frame) return;
      cancelAnimationFrame(frame);
      frame = 0;
    };

    const onVisibility = () => (document.hidden ? stop() : start());
    document.addEventListener('visibilitychange', onVisibility);

    const intersectionObserver = new IntersectionObserver(
      ([entry]) => {
        inView = Boolean(entry?.isIntersecting);
        if (inView) start();
        else stop();
      },
      { threshold: 0 },
    );
    intersectionObserver.observe(container);

    const onContextLost = (event: Event) => {
      event.preventDefault();
      stop();
      markFallback();
    };
    canvas.addEventListener('webglcontextlost', onContextLost);

    start();

    /* ----- Limpieza ------------------------------------------------------- */
    return () => {
      stop();
      window.removeEventListener('pointermove', onPointerMove);
      document.removeEventListener('visibilitychange', onVisibility);
      canvas.removeEventListener('webglcontextlost', onContextLost);
      resizeObserver.disconnect();
      intersectionObserver.disconnect();

      particleGeometry.dispose();
      particleMaterial.dispose();
      fogGeometry.dispose();
      fogMaterial.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      canvas.remove();
      delete container.dataset.webgl;
    };
  }, []);

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className={cn('webgl-fallback noise absolute inset-0 overflow-hidden', className)}
    />
  );
}

export default WebGLHeroBackground;

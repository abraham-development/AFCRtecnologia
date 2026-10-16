import nextCoreWebVitals from 'eslint-config-next/core-web-vitals';
import nextTypeScript from 'eslint-config-next/typescript';

/** @type {import('eslint').Linter.Config[]} */
const config = [
  {
    ignores: [
      '.next/**',
      'node_modules/**',
      'out/**',
      'next-env.d.ts',
      // Worker de MapLibre copiado desde node_modules en cada dev/build (código de terceros minificado)
      'public/maplibre/**',
      // Herramientas del entorno local, ajenas al codigo de la landing
      '.agents/**',
      '.claude/**',
      '.codex/**',
      '.cursor/**',
      '.impeccable/**',
    ],
  },
  ...nextCoreWebVitals,
  ...nextTypeScript,
  {
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
    },
  },
];

export default config;

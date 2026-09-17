import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { FlatCompat } from '@eslint/eslintrc';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends('next/core-web-vitals', 'next/typescript'),
  {
    rules: {
      // Cegah variabel dideklarasikan tapi tidak dipakai
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
      // Cegah Promise mengambang tanpa await/catch
      '@typescript-eslint/no-floating-promises': 'error',
      // Larang catch block kosong
      'no-empty': ['error', { allowEmptyCatch: false }],
      // Konsistensi
      'no-console': ['warn', { allow: ['warn', 'error'] }],
    },
  },
  {
    // Pengecualian untuk skrip utilitas dan seed
    files: ['scripts/**/*.ts', 'prisma/seed.ts'],
    rules: {
      'no-console': 'off',
      '@typescript-eslint/no-floating-promises': 'off',
    },
  },
];

export default eslintConfig;

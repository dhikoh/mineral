import nextCoreWebVitals from 'eslint-config-next/core-web-vitals';
import nextTypescript from 'eslint-config-next/typescript';

/**
 * NEW-01: Migrasi ke ESLint 9 Flat Config murni tanpa FlatCompat.
 * Menghilangkan crash circular structure pada eslint-plugin-react.
 */
const eslintConfig = [
  ...nextCoreWebVitals,
  ...nextTypescript,
  {
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
      // Izinkan catch block yang sengaja diabaikan
      'no-empty': ['error', { allowEmptyCatch: true }],
      // Warning untuk console log
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      // Warning untuk any type
      '@typescript-eslint/no-explicit-any': 'warn',
      // Warning untuk aturan React Hooks eksperimental di React 19 / ESLint 9
      'react-hooks/set-state-in-effect': 'warn',
      'react-hooks/exhaustive-deps': 'warn',
      'react-hooks/purity': 'warn',
      'react-hooks/immutability': 'warn',
      'react/no-unescaped-entities': 'warn',
      'prefer-const': 'warn',
    },
  },
  {
    // Konfigurasi khusus Tailwind dan skrip
    files: ['tailwind.config.ts', 'scripts/**/*.ts', 'prisma/seed.ts'],
    rules: {
      'no-console': 'off',
      '@typescript-eslint/no-require-imports': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
];

export default eslintConfig;

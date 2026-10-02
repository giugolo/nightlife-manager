import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import prettier from 'eslint-config-prettier';
import globals from 'globals';

export default tseslint.config(
  // Ignore build output and generated/vendor folders
  {
    ignores: [
      'dist/**',
      'node_modules/**',
      '.firebase/**',
      'landing/**',
      'coverage/**',
    ],
  },

  // Base JS recommended rules
  js.configs.recommended,

  {
    files: ['scripts/**/*.{mjs,cjs}'],
    languageOptions: { globals: globals.node },
  },

  // TypeScript recommended rules
  ...tseslint.configs.recommended,

  // React + hooks for source files
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    plugins: {
      react,
      'react-hooks': reactHooks,
    },
    settings: {
      react: { version: 'detect' },
    },
    rules: {
      ...react.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,

      // React 19 + new JSX transform: no need to import React in scope
      'react/react-in-jsx-scope': 'off',
      'react/jsx-uses-react': 'off',
      // Project does not use prop-types (TypeScript covers this)
      'react/prop-types': 'off',
      // Apostrophes/quotes in Italian UI text (es. "l'evento") are intentional;
      // escaping them as HTML entities would hurt readability without any benefit.
      'react/no-unescaped-entities': 'off',

      // Keep stylistic / non-critical issues as warnings so lint does not
      // explode into hundreds of blocking errors on an existing codebase.
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      'no-empty': 'warn',
      'prefer-const': 'warn',
    },
  },

  // Test files: allow jsdom/node globals and be a bit more permissive
  {
    files: ['tests/**/*.{ts,tsx}', '**/*.test.{ts,tsx}'],
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.browser,
      },
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },

  // Disable ESLint rules that conflict with Prettier (must be last)
  prettier
);

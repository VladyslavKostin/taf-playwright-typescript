// @ts-check
const js = require('@eslint/js');
const tseslint = require('typescript-eslint');
const eslintConfigPrettier = require('eslint-config-prettier');

const NO_SELECTORS_OUTSIDE_COMPONENTS = {
  selector: "CallExpression[callee.property.name='locator']",
  message:
    'Selectors belong only in src/components/ — compose an existing Component method instead of calling .locator() here (see SPEC.md rule 2).',
};

const NO_ASSERTIONS_IN_COMPONENTS_OR_FLOWS = {
  selector: "CallExpression[callee.name='expect']",
  message:
    'Components and flows never assert — return typed data/perform the action and let the spec decide what it means (see SPEC.md rules 3-4).',
};

module.exports = tseslint.config(
  {
    ignores: ['node_modules', 'dist', 'playwright-report', 'test-results'],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  eslintConfigPrettier,
  {
    languageOptions: {
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'commonjs',
      },
    },
  },
  {
    // this config file itself runs under plain Node CommonJS, not the TS project
    files: ['eslint.config.js'],
    languageOptions: {
      globals: { require: 'readonly', module: 'writable' },
    },
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
    },
  },
  {
    // Rule 2: selectors exist only in src/components/
    files: ['src/flows/**/*.ts', 'src/contracts/**/*.ts', 'src/api/**/*.ts', 'src/builders/**/*.ts', 'src/core/**/*.ts', 'tests/**/*.ts'],
    rules: {
      'no-restricted-syntax': ['error', NO_SELECTORS_OUTSIDE_COMPONENTS],
    },
  },
  {
    // Rules 3-4: components/flows never assert
    files: ['src/components/**/*.ts', 'src/flows/**/*.ts'],
    rules: {
      'no-restricted-syntax': ['error', NO_ASSERTIONS_IN_COMPONENTS_OR_FLOWS],
    },
  },
  {
    files: ['**/*.ts'],
    rules: {
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/no-explicit-any': 'warn',
    },
  },
);

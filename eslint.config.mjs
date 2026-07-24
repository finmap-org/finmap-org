/** @type {import('eslint').Linter.Config} */
import tseslint from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import js from '@eslint/js';
import globals from 'globals';
import prettierConfig from 'eslint-config-prettier';

export default [
  // Basic recommended rules
  js.configs.recommended,
  
  // Files to ignore from linting
  {
    ignores: [
      'node_modules/**',
      'tests/**',
      'dist/**',
      'assets/**',
      '*.min.js',
    ],
  },
  
  // TypeScript files configuration
  {
    files: ['**/*.ts'],
    ignores: [
      '**/*.json',
      '**/*.svg',
      '**/*.css',
      '**/*.html',
    ],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      parser: tsParser,
      parserOptions: {
        project: './tsconfig.json',
      },
      globals: {
        ...globals.browser,
        Buffer: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': tseslint,
    },
    rules: {
      // === Security & Best Practices ===
      // Disabled 'no-console' to allow logging blocked requests
      // 'no-console': 'warn',
      'no-eval': 'error', // Prevent eval() usage which is dangerous
      'no-implied-eval': 'error', // Prevent implied eval via setTimeout/setInterval strings
      'prefer-promise-reject-errors': 'error', // Enforce standard Promise rejections
      
      // === TypeScript Type Safety ===
      '@typescript-eslint/no-explicit-any': 'warn', // Avoid using 'any' type
      '@typescript-eslint/explicit-function-return-type': 'warn', // Require return types
      '@typescript-eslint/no-namespace': 'error', // Prevent wildcard/namespace imports
      'no-unused-vars': ['error', {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_'
      }], // Standard JS unused vars rule with underscore prefix ignored
      '@typescript-eslint/no-unused-vars': ['warn', { 
        argsIgnorePattern: '^_|^e$',
        varsIgnorePattern: '^_'
      }], // Allow unused error variables
      '@typescript-eslint/no-unsafe-assignment': 'warn', // Prevent unsafe assignments
      '@typescript-eslint/no-unsafe-member-access': 'warn', // Prevent unsafe property access
      '@typescript-eslint/no-unsafe-call': 'warn', // Prevent unsafe function calls
      '@typescript-eslint/no-unsafe-argument': 'warn', // Prevent unsafe arguments
      '@typescript-eslint/restrict-template-expressions': ['warn', {
        allowNumber: true,
        allowBoolean: true,
      }], // Safer template literals
      '@typescript-eslint/no-floating-promises': ['warn', {
        ignoreVoid: true, 
      }], // Prevent unhandled promises
      
      // === Code Quality ===
      'no-warning-comments': ['warn', { 
        terms: ['todo', 'fixme', 'xxx'],  // Removed 'console.log' from warning terms
        location: 'anywhere' 
      }],
      'no-debugger': 'error', // No debugger statements in production
      
      // === Complexity Control ===
      'complexity': ['warn', 22],
      'max-depth': ['warn', 4],
      'max-lines': ['warn', 800],
      'max-lines-per-function': ['warn', 120],
      'max-params': ['warn', 5],
      'max-nested-callbacks': ['warn', 3],
      
      // === Style & Formatting ===
      'semi': ['error', 'always'],
      'quotes': ['error', 'single', { avoidEscape: true }],
      'indent': ['error', 2],
      'comma-dangle': ['error', 'always-multiline'],
      'object-curly-spacing': ['error', 'always'],
      'eol-last': ['error', 'always'], // Ensure files end with newline
      'no-trailing-spaces': 'error', // No trailing whitespace
      'no-case-declarations': 'warn', // Allow declarations in case blocks with a warning
    },
  },
  
  // Add a specific config for the ESLint config file itself
  {
    files: ['eslint.config.mjs'],
    languageOptions: {
      sourceType: 'module',  // This is crucial for .mjs files
      ecmaVersion: 2022,
      globals: {
        __dirname: 'readonly',
        process: 'readonly',
      },
    },
  },

  // JavaScript config files
  {
    files: ['webpack.config.js', 'webpack.config.cjs', '*.config.js', '*.config.cjs'],
    languageOptions: {
      sourceType: 'commonjs',
      globals: {
        __dirname: 'readonly',
        __filename: 'readonly',
        process: 'readonly',
        module: 'readonly',
        require: 'readonly',
      },
    },
    rules: {
      'no-console': 'off', // Allow console in config files
      '@typescript-eslint/no-var-requires': 'off', // Allow CommonJS requires in config files
    },
  },
  
  // Prettier configuration - must be last to override other formatting rules
  prettierConfig,
];
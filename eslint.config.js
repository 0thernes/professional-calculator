// ESLint flat config (ESLint 9+). Pragmatic rules for a zero-dependency,
// native-ESM codebase: catch real bugs (undefined refs, unsafe comparisons,
// unreachable code) without fighting intentional numeric style.
import js from '@eslint/js';
import globals from 'globals';

export default [
    js.configs.recommended,
    {
        files: ['**/*.js'],
        languageOptions: {
            ecmaVersion: 2023,
            sourceType: 'module',
            globals: {
                ...globals.browser,
                ...globals.es2021,
            },
        },
        rules: {
            'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
            'no-undef': 'error',
            'no-constant-condition': ['error', { checkLoops: false }],
            'eqeqeq': ['warn', 'smart'],
            'no-var': 'error',
            'prefer-const': 'warn',
        },
    },
    {
        // Tests run under Jest (globals injected) + jsdom.
        files: ['tests/**/*.js'],
        languageOptions: {
            globals: { ...globals.jest, ...globals.node, ...globals.browser },
        },
    },
    {
        // Bench + main bootstrap touch Node and the DOM directly.
        files: ['bench/**/*.js'],
        languageOptions: { globals: { ...globals.node } },
    },
    {
        // Build-time knowledge compiler (Node ESM; output is committed).
        files: ['tools/**/*.mjs', 'tools/**/*.js'],
        languageOptions: { sourceType: 'module', globals: { ...globals.node } },
    },
    {
        ignores: ['node_modules/**', 'coverage/**'],
    },
];

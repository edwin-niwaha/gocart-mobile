const expoConfig = require('eslint-config-expo/flat');
const globals = require('globals');

module.exports = [
  ...expoConfig,
  {
    ignores: [
      '.expo/**',
      'android/**',
      'dist/**',
      'ios/**',
      'node_modules/**',
      'web-build/**',
    ],
  },
  {
    files: ['*.js', 'scripts/**/*.js'],
    languageOptions: {
      globals: globals.node,
    },
    rules: {
      'no-console': 'off',
    },
  },
  {
    files: ['**/*.ts', '**/*.tsx'],
    rules: {
      'no-console': ['warn', { allow: ['warn', 'error'] }],
    },
  },
];

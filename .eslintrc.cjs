/* eslint-env node */
// const createAliasSetting = require('@vue/eslint-config-airbnb/createAliasSetting');

module.exports = {
  'root': true,
  'extends': [
    'plugin:vue/vue3-recommended',
    'eslint:recommended',
  ],
  'rules': {
    // ESLint
    'indent': ['warn', 2, { 'SwitchCase': 1 }],
    'comma-dangle': ['warn', 'always-multiline'],
    'no-unused-vars': ['warn', { 'args': 'none' }],
    'semi': 'warn',
    'quotes': ['warn' , 'single'],
    'object-curly-spacing': ['warn', 'always'],

    // Vue
    'vue/multi-word-component-names': 'off',
    'vue/require-default-prop': 'off',
    'vue/max-attributes-per-line': ['warn', { singleline: { max: 4 } }],
    'vue/html-self-closing': ['warn', { html: { void: 'always' } }],
  },
  'globals': {
    '__dirname': 'readonly',
    'process': 'readonly',
    'require': 'readonly',
    'module': 'readonly',
    'Buffer': 'readonly',
  },
  'overrides': [
    {
      'files': ['src/**'],
      'rules': {
        '@dword-design/import-alias/prefer-alias': ['warn', { 'alias': {
          '@': './src',
        } }],
      },
    },
  ],
  'env': {
    'vue/setup-compiler-macros': true,
  },
  'ignorePatterns': [
    'src/assets/i18n/index.mjs', // "assert" syntax is currently unrecognized
  ],
  'parserOptions': {
    'ecmaVersion': 2022,
    'sourceType': 'module',
  },
  settings: {
    // ...createAliasSetting({
    //   '@': './src',
    // }),
  },
};

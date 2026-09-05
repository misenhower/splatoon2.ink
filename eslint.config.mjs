import js from '@eslint/js';
import pluginVue from 'eslint-plugin-vue';
import globals from 'globals';

export default [
  {
    ignores: ['dist/**', 'node_modules/**', '.wrangler/**', 'workers/**/.wrangler/**'],
  },

  js.configs.recommended,
  ...pluginVue.configs['flat/vue2-recommended'],

  {
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    rules: {
      // ESLint
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
      'vue/no-deprecated-filter': 'off',
      'vue/require-toggle-inside-transition': 'off',
      'vue/no-deprecated-destroyed-lifecycle': 'off',
    },
  },

  // Root config files are CommonJS (the package has no "type": "module")
  {
    files: ['*.config.js'],
    languageOptions: { sourceType: 'commonjs' },
  },
];

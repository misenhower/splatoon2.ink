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
      // Preserve this site's existing template layout instead of reformatting it on lint.
      'vue/html-indent': ['warn', 4],
      'vue/attributes-order': 'off',
      'vue/max-attributes-per-line': 'off',
      'vue/html-self-closing': 'off',
      'vue/singleline-html-element-content-newline': 'off',
      'vue/multiline-html-element-content-newline': 'off',
      'vue/block-order': 'off',
      'vue/multi-word-component-names': 'off',
      'vue/require-default-prop': 'off',
      'vue/no-deprecated-filter': 'off',
      'vue/require-toggle-inside-transition': 'off',
      'vue/no-deprecated-destroyed-lifecycle': 'off',
    },
  },
];

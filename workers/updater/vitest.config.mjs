import { fileURLToPath } from 'node:url';
import { cloudflareTest } from '@cloudflare/vitest-plugin';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [
    cloudflareTest({
      // Browser captures are mocked; automated tests never use the remote service.
      remoteBindings: false,
      wrangler: {
        configPath: fileURLToPath(new URL('./wrangler.jsonc', import.meta.url)),
      },
    }),
  ],
  test: {
    include: ['workers/updater/**/*.spec.mjs'],
    deps: {
      optimizer: {
        // ics -> yup -> property-expr is CommonJS; pre-bundle it so its named exports resolve
        // in vitest's module runner the way they do in wrangler's bundle.
        ssr: { enabled: true, include: ['ics'] },
      },
    },
  },
});

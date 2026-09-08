import BrowserRunRenderer from '../../src/app/screenshots/BrowserRunRenderer.js';
import ScreenshotGenerator from '../../src/app/screenshots/ScreenshotGenerator.js';

// Local capture-only entry point: no scheduler, buckets, or social clients.
export default {
  async fetch(request, env) {
    let params = new URL(request.url).searchParams;
    let url = params.get('url');

    if (request.method !== 'GET')
      return new Response('Use GET with a url query parameter.', { status: 405 });

    try {
      if (!url || !['https:', 'http:'].includes(new URL(url).protocol))
        return new Response('Provide a full HTTP(S) screenshot page URL in ?url=.', { status: 400 });
    } catch {
      return new Response('Invalid screenshot page URL.', { status: 400 });
    }

    let screenshots = new ScreenshotGenerator(new BrowserRunRenderer(env.BROWSER));

    try {
      let result = await screenshots.capture({ url });

      return new Response(result.image, {
        headers: {
          'Content-Type': result.type,
          'Cache-Control': 'no-store',
        },
      });
    } catch (error) {
      console.error(error);

      return new Response(error.message, { status: 502 });
    }
  },
};

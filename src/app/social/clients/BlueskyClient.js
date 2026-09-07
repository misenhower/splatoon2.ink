import { BskyAgent, RichText } from '@atproto/api';

export default class BlueskyClient
{
  key = 'bluesky';
  name = 'Bluesky';

  // Bluesky limits image size, so posts are rendered as JPEG for it
  mediaType = 'image/jpeg';

  #agent;

  constructor({ agent = null } = {}) {
    this.#agent = agent;
  }

  async canSend() {
    return process.env.BLUESKY_SERVICE
      && process.env.BLUESKY_IDENTIFIER
      && process.env.BLUESKY_PASSWORD;
  }

  async login() {
    if (!this.#agent) {
      this.#agent = new BskyAgent({
        service: process.env.BLUESKY_SERVICE,
      });

      await this.#agent.login({
        identifier: process.env.BLUESKY_IDENTIFIER,
        password: process.env.BLUESKY_PASSWORD,
      });
    }
  }

  async send(status) {
    await this.login();

    // Upload images
    let images = await Promise.all(
      status.media.map(async m => {
        let response = await this.#agent.uploadBlob(m.file, { encoding: m.type });

        return {
          image: response.data.blob,
          alt: m.altText || '',
          ...(m.width && m.height ? { aspectRatio: { width: m.width, height: m.height } } : {}),
        };
      }),
    );

    // Send status
    const rt = new RichText({
      text: status.status,
    });

    await rt.detectFacets(this.#agent);

    await this.#agent.post({
      text: rt.text,
      facets: rt.facets,
      embed: {
        images,
        $type: 'app.bsky.embed.images',
      },
    });
  }
}

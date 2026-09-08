import { env } from 'cloudflare:workers';

export async function convertToJpeg(png, images = env.IMAGES) {
    let result = await images
        .input(new Response(png).body)
        .transform({ background: '#ffffff' })
        .output({ format: 'image/jpeg', quality: 90 });

    return new Uint8Array(await result.response().arrayBuffer());
}

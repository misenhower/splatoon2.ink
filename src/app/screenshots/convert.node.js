import sharp from 'sharp';

// Node-only adapter; package imports keep native sharp out of the Worker bundle.
export async function convertToJpeg(png) {
    return new Uint8Array(
        await sharp(png).flatten({ background: '#ffffff' }).jpeg({ quality: 90 }).toBuffer(),
    );
}

import { expect, it, vi } from 'vitest';
import { env } from 'cloudflare:test';
import { convertToJpeg } from '../../src/app/screenshots/convert.worker.js';

it('converts a PNG through the local Images binding without changing its dimensions', async () => {
  const png = Uint8Array.from(atob('iVBORw0KGgoAAAANSUhEUgAAAAIAAAABCAIAAAB7QOjdAAAACXBIWXMAAAPoAAAD6AG1e1JrAAAAD0lEQVQImWP4z8Dwn4EBAAj+Af/KOtJRAAAAAElFTkSuQmCC'), c => c.charCodeAt(0));
  const jpeg = await convertToJpeg(png);
  expect([...jpeg.slice(0, 3)]).toEqual([255, 216, 255]);
  const info = await env.IMAGES.info(new Response(jpeg).body);
  expect(info.width).toBe(2);
  expect(info.height).toBe(1);
});

it('passes the original PNG bytes to Images and returns JPEG bytes', async () => {
  const png = new Uint8Array([137, 80, 78, 71]);
  const jpeg = new Uint8Array([255, 216, 255]);
  let source;
  const output = vi.fn(async () => ({ response: () => new Response(jpeg) }));
  const transform = vi.fn(() => ({ output }));
  const images = { input: stream => { source = stream; return { transform }; } };
  expect(await convertToJpeg(png, images)).toEqual(jpeg);
  expect(new Uint8Array(await new Response(source).arrayBuffer())).toEqual(png);
  expect(transform).toHaveBeenCalledWith({ background: '#ffffff' });
  expect(output).toHaveBeenCalledWith({ format: 'image/jpeg', quality: 90 });
});

it('propagates Images failures to the posting pipeline', async () => {
  const images = { input: () => ({ transform: () => ({ output: async () => { throw new Error('Images quota exceeded'); } }) }) };
  await expect(convertToJpeg(new Uint8Array([1]), images)).rejects.toThrow('Images quota exceeded');
});

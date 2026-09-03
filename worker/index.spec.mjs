import { describe, expect, it, vi } from 'vitest';
import worker from './index.js';

class FakeBucket
{
  calls = [];

  constructor(result = {}) {
    this.result = {
      cursor: undefined,
      delimitedPrefixes: ['data/locale/'],
      objects: [{
        etag: 'opaque-etag',
        key: 'data/schedules.json',
        size: 54861,
        uploaded: new Date('2026-08-30T17:30:26Z'),
      }],
      truncated: false,
      ...result,
    };
  }

  async list(options) {
    this.calls.push(options);
    return this.result;
  }
}

describe('R2 directory index', () => {
  it('renders a directory listing through the internal route with public links', async () => {
    let bucket = new FakeBucket;
    let response = await worker.fetch(new Request(
      'https://assets.splatoon2.ink/__directory/data/',
    ), { ASSETS: bucket });
    let html = await response.text();

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toBe('text/html; charset=utf-8');
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(html).toContain('<main class="shell">');
    expect(html).toContain('class="entry-icon entry-icon--folder"');
    expect(html).toContain('class="entry-icon entry-icon--file"');
    expect(html).toContain('class="listing-header"');
    expect(html).toContain('href="/data/locale/"');
    expect(html).toContain('href="/data/schedules.json"');
    expect(html).not.toContain('__directory');
    expect(bucket.calls).toEqual([{
      cursor: undefined,
      delimiter: '/',
      limit: 1000,
      prefix: 'data/',
    }]);
  });

  it('returns paginated JSON with encoded canonical URLs', async () => {
    let bucket = new FakeBucket({
      cursor: 'next page',
      delimitedPrefixes: ['screenshots/Octo Expansion/bosses/'],
      objects: [{
        etag: 'etag-value',
        key: 'screenshots/Octo Expansion/odd<&".png',
        size: 1536,
        uploaded: new Date('2026-08-31T01:02:03Z'),
      }],
      truncated: true,
    });
    let response = await worker.fetch(new Request(
      'https://assets.splatoon2.ink/__directory/screenshots/Octo%20Expansion/?format=json&cursor=current%20page',
    ), { ASSETS: bucket });

    expect(response.status).toBe(200);
    expect(response.headers.get('access-control-allow-origin')).toBe('*');
    expect(await response.json()).toEqual({
      schemaVersion: 1,
      directory: {
        prefix: 'screenshots/Octo Expansion/',
        url: 'https://assets.splatoon2.ink/screenshots/Octo%20Expansion/',
      },
      directories: [{
        name: 'bosses/',
        prefix: 'screenshots/Octo Expansion/bosses/',
        url: 'https://assets.splatoon2.ink/screenshots/Octo%20Expansion/bosses/',
      }],
      files: [{
        name: 'odd<&".png',
        key: 'screenshots/Octo Expansion/odd<&".png',
        url: 'https://assets.splatoon2.ink/screenshots/Octo%20Expansion/odd%3C%26%22.png',
        size: 1536,
        uploaded: '2026-08-31T01:02:03.000Z',
        etag: 'etag-value',
      }],
      next: 'https://assets.splatoon2.ink/screenshots/Octo%20Expansion/?format=json&cursor=next%20page',
    });
    expect(bucket.calls).toEqual([{
      cursor: 'current page',
      delimiter: '/',
      limit: 1000,
      prefix: 'screenshots/Octo Expansion/',
    }]);
  });

  it('escapes object names and preserves pagination in HTML', async () => {
    let bucket = new FakeBucket({
      cursor: 'opaque cursor',
      delimitedPrefixes: [],
      objects: [{
        key: 'odd<&".json',
        size: 1536,
        uploaded: new Date('2026-08-30T17:30:26Z'),
      }],
      truncated: true,
    });
    let response = await worker.fetch(
      new Request('https://assets.splatoon2.ink/__directory/'),
      { ASSETS: bucket },
    );
    let html = await response.text();

    expect(html).toContain('<link rel="canonical" href="https://assets.splatoon2.ink/">');
    expect(html).toContain('href="/odd%3C%26%22.json"');
    expect(html).toContain('odd&lt;&amp;&quot;.json');
    expect(html).toContain('1.5 KB');
    expect(html).toContain('2026-08-30 17:30:26 UTC');
    expect(html).toContain('href="/?cursor=opaque%20cursor"');
  });

  it('supports HEAD and rejects other methods before reading R2', async () => {
    let headBucket = new FakeBucket;
    let headResponse = await worker.fetch(new Request(
      'https://assets.splatoon2.ink/__directory/data/?format=json',
      { method: 'HEAD' },
    ), { ASSETS: headBucket });
    let postBucket = new FakeBucket;
    let postResponse = await worker.fetch(new Request(
      'https://assets.splatoon2.ink/__directory/data/',
      { method: 'POST' },
    ), { ASSETS: postBucket });

    expect(headResponse.status).toBe(200);
    expect(headResponse.headers.get('content-type')).toBe('application/json; charset=utf-8');
    expect(await headResponse.text()).toBe('');
    expect(headBucket.calls).toHaveLength(1);
    expect(postResponse.status).toBe(405);
    expect(postResponse.headers.get('allow')).toBe('GET, HEAD');
    expect(await postResponse.text()).toBe('Method not allowed');
    expect(postBucket.calls).toHaveLength(0);
  });

  it('returns a controlled machine-readable response when R2 fails', async () => {
    let errorLog = vi.spyOn(console, 'error').mockImplementation(() => {});
    let bucket = {
      list: vi.fn().mockRejectedValue(new Error('R2 unavailable')),
    };
    let response = await worker.fetch(new Request(
      'https://assets.splatoon2.ink/__directory/data/?format=json',
    ), { ASSETS: bucket });

    expect(response.status).toBe(500);
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(await response.json()).toEqual({
      schemaVersion: 1,
      error: {
        code: 'listing_unavailable',
        message: 'Directory listing unavailable',
      },
    });
    expect(errorLog).toHaveBeenCalledWith(JSON.stringify({
      error: 'R2 unavailable',
      message: 'R2 directory listing failed',
      prefix: 'data/',
    }));
    errorLog.mockRestore();
  });

  it('returns controlled errors for invalid paths, formats, and missing directories', async () => {
    let bucket = new FakeBucket({
      delimitedPrefixes: [],
      objects: [],
    });

    let invalidPath = await worker.fetch(new Request(
      'https://assets.splatoon2.ink/__directory/%E0%A4%A',
    ), { ASSETS: bucket });
    let unsupportedFormat = await worker.fetch(new Request(
      'https://assets.splatoon2.ink/__directory/data/?format=xml',
    ), { ASSETS: bucket });
    let missingDirectory = await worker.fetch(new Request(
      'https://assets.splatoon2.ink/__directory/missing/',
    ), { ASSETS: bucket });

    expect(invalidPath.status).toBe(400);
    expect(await invalidPath.text()).toBe('Invalid path');
    expect(unsupportedFormat.status).toBe(400);
    expect(await unsupportedFormat.json()).toEqual({
      schemaVersion: 1,
      error: {
        code: 'unsupported_format',
        message: 'Unsupported format',
      },
    });
    expect(missingDirectory.status).toBe(404);
    expect(await missingDirectory.text()).toBe('Directory not found');
    expect(bucket.calls).toHaveLength(1);
  });
});

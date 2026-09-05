export { default as MemoryBucket } from './MemoryBucket.js';
export { default as BucketStorage } from './BucketStorage.js';
export { default as FilesystemStorage } from './FilesystemStorage.js';

// What the S3 sync applied to data/ objects; the R2 objects carry it directly.
export const DATA_CACHE_CONTROL = 'no-cache, stale-while-revalidate=5, stale-if-error=86400';

const CONTENT_TYPES = {
    json: 'application/json',
    ics: 'text/calendar',
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    gif: 'image/gif',
    svg: 'image/svg+xml',
    webp: 'image/webp',
};

export function contentTypeFor(key) {
    let extension = key.split('.').pop().toLowerCase();
    return CONTENT_TYPES[extension];
}

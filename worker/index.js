const INTERNAL_PREFIX = '/__directory';
const PAGE_SIZE = 1000;

/** @param {string} value */
function escapeHtml(value) {
  return value.replace(/[&<>"']/g, character => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    '\u0027': '&#39;',
  })[character]);
}

/** @param {string} key */
function publicPath(key) {
  return `/${key.split('/').map(encodeURIComponent).join('/')}`;
}

/** @param {string} prefix */
function parentPath(prefix) {
  let parts = prefix.split('/').filter(Boolean);
  parts.pop();
  return parts.length ? publicPath(`${parts.join('/')}/`) : '/';
}

/** @param {number} bytes */
function formatSize(bytes) {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  let value = bytes;
  let unit = 'B';
  for (let candidate of ['KB', 'MB', 'GB', 'TB']) {
    value /= 1024;
    unit = candidate;
    if (value < 1024) {
      break;
    }
  }
  return `${value.toFixed(value < 10 ? 1 : 0)} ${unit}`;
}

/** @param {Date} date */
function formatDate(date) {
  return `${date.toISOString().slice(0, 19).replace('T', ' ')} UTC`;
}

/**
 * @param {Request} request
 * @param {unknown} value
 * @param {number} [status]
 * @param {HeadersInit} [headers]
 */
function jsonResponse(request, value, status = 200, headers = {}) {
  let body = JSON.stringify(value);
  return new Response(request.method === 'HEAD' ? null : body, {
    status,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'no-store',
      'Content-Type': 'application/json; charset=utf-8',
      'X-Content-Type-Options': 'nosniff',
      ...headers,
    },
  });
}

/**
 * @param {Request} request
 * @param {number} status
 * @param {string} message
 * @param {HeadersInit} [headers]
 */
function textErrorResponse(request, status, message, headers = {}) {
  return new Response(request.method === 'HEAD' ? null : message, {
    status,
    headers: {
      'Cache-Control': 'no-store',
      'Content-Type': 'text/plain; charset=utf-8',
      'X-Content-Type-Options': 'nosniff',
      ...headers,
    },
  });
}

/**
 * @param {Request} request
 * @param {number} status
 * @param {string} code
 * @param {string} message
 * @param {HeadersInit} [headers]
 */
function errorResponse(request, status, code, message, headers = {}) {
  if (new URL(request.url).searchParams.get('format') !== 'json') {
    return textErrorResponse(request, status, message, headers);
  }

  return jsonErrorResponse(request, status, code, message, headers);
}

/**
 * @param {Request} request
 * @param {number} status
 * @param {string} code
 * @param {string} message
 * @param {HeadersInit} [headers]
 */
function jsonErrorResponse(request, status, code, message, headers = {}) {
  return jsonResponse(request, {
    schemaVersion: 1,
    error: { code, message },
  }, status, headers);
}

/**
 * @param {string} origin
 * @param {string} prefix
 * @param {R2Objects} listing
 * @param {string | undefined} requestedCursor
 */
function directoryPage(origin, prefix, listing, requestedCursor) {
  let pathname = publicPath(prefix);
  return {
    directories: listing.delimitedPrefixes.map(directoryPrefix => ({
      name: directoryPrefix.slice(prefix.length),
      pathname: publicPath(directoryPrefix),
      prefix: directoryPrefix,
      url: new URL(publicPath(directoryPrefix), origin).href,
    })),
    files: listing.objects.map(object => ({
      etag: object.etag,
      key: object.key,
      name: object.key.slice(prefix.length),
      pathname: publicPath(object.key),
      size: object.size,
      uploaded: object.uploaded,
      url: new URL(publicPath(object.key), origin).href,
    })),
    nextCursor: listing.truncated ? listing.cursor : undefined,
    pathname,
    prefix,
    requestedCursor,
    url: new URL(pathname, origin).href,
  };
}

/** @param {string} prefix */
function breadcrumbHtml(prefix) {
  let parts = prefix.split('/').filter(Boolean);
  if (!parts.length) {
    return '<span aria-current="page">assets</span>';
  }

  let crumbs = ['<a href="/">assets</a>'];
  for (let index = 0; index < parts.length; index++) {
    crumbs.push('<span class="breadcrumb-separator" aria-hidden="true">/</span>');
    if (index === parts.length - 1) {
      crumbs.push(`<span aria-current="page">${escapeHtml(parts[index])}</span>`);
    } else {
      let path = publicPath(`${parts.slice(0, index + 1).join('/')}/`);
      crumbs.push(`<a href="${path}">${escapeHtml(parts[index])}</a>`);
    }
  }
  return crumbs.join('');
}

/** @param {ReturnType<typeof directoryPage>} page */
function renderListing(page) {
  let rows = [];
  if (page.prefix) {
    rows.push(`<li><a class="listing-row parent-row" href="${parentPath(page.prefix)}"><span class="listing-cell entry"><span class="visually-hidden">Name: </span><span class="entry-icon entry-icon--parent" aria-hidden="true">↑</span><span class="entry-name">Parent directory</span></span><span class="listing-cell"></span><span class="listing-cell"></span></a></li>`);
  }
  for (let directory of page.directories) {
    rows.push(`<li><a class="listing-row" href="${directory.pathname}"><span class="listing-cell entry"><span class="visually-hidden">Name: </span><span class="entry-icon entry-icon--folder" aria-hidden="true"></span><span class="entry-name">${escapeHtml(directory.name)}</span></span><span class="listing-cell"></span><span class="listing-cell"><span class="visually-hidden">Type: </span><span class="type-label">Folder</span></span></a></li>`);
  }
  for (let file of page.files) {
    rows.push(`<li><a class="listing-row" href="${file.pathname}"><span class="listing-cell entry"><span class="visually-hidden">Name: </span><span class="entry-icon entry-icon--file" aria-hidden="true"></span><span class="entry-name">${escapeHtml(file.name)}</span></span><span class="listing-cell"><span class="visually-hidden">Last modified: </span><time datetime="${file.uploaded.toISOString()}">${formatDate(file.uploaded)}</time></span><span class="listing-cell"><span class="visually-hidden">Size: </span>${formatSize(file.size)}</span></a></li>`);
  }
  if (!rows.length) {
    rows.push('<li class="empty-state">This directory is empty.</li>');
  }

  let jsonCursor = page.requestedCursor
    ? `&amp;cursor=${encodeURIComponent(page.requestedCursor)}`
    : '';
  let next = page.nextCursor
    ? `<a class="next-page" rel="next" href="${page.pathname}?cursor=${encodeURIComponent(page.nextCursor)}">Next page <span aria-hidden="true">→</span></a>`
    : '';
  let title = `Asset browser — ${page.pathname}`;
  let nonce = crypto.randomUUID().replaceAll('-', '');
  let folderCount = page.directories.length;
  let fileCount = page.files.length;
  let summary = `${folderCount} ${folderCount === 1 ? 'folder' : 'folders'} · ${fileCount} ${fileCount === 1 ? 'file' : 'files'}`;

  return {
    body: `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="color-scheme" content="light dark">
  <link rel="canonical" href="${page.url}">
  <link rel="alternate" type="application/json" href="${page.pathname}?format=json${jsonCursor}">
  <title>${escapeHtml(title)}</title>
  <style nonce="${nonce}">
    :root {
      color-scheme: light dark;
      --background: #f3f5f9;
      --background-accent: #e8e4ff;
      --surface: rgba(255, 255, 255, 0.88);
      --surface-strong: #fff;
      --text: #18202f;
      --muted: #657084;
      --border: #dce1ea;
      --accent: #6047d9;
      --accent-soft: #eeeaff;
      --folder: #8a6cff;
      --file: #8290a6;
      --row-hover: #f7f5ff;
      --shadow: 0 24px 70px rgba(38, 29, 82, 0.12);
    }

    * { box-sizing: border-box; }

    body {
      min-height: 100vh;
      margin: 0;
      background:
        radial-gradient(circle at 15% 0%, var(--background-accent), transparent 34rem),
        var(--background);
      color: var(--text);
      font-family: ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      line-height: 1.5;
    }

    a { color: inherit; }

    .shell {
      width: min(960px, calc(100% - 40px));
      margin: 0 auto;
      padding: 48px 0;
    }

    .browser {
      overflow: hidden;
      border: 1px solid var(--border);
      border-radius: 18px;
      background: var(--surface);
      box-shadow: var(--shadow);
      backdrop-filter: blur(14px);
    }

    .browser-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 20px;
      min-height: 68px;
      padding: 16px 20px;
      border-bottom: 1px solid var(--border);
      background: var(--surface-strong);
    }

    .breadcrumbs {
      display: flex;
      min-width: 0;
      align-items: center;
      gap: 8px;
      overflow: hidden;
      font-family: ui-monospace, "SFMono-Regular", Consolas, monospace;
      font-size: 0.9rem;
      white-space: nowrap;
    }

    .breadcrumbs a {
      color: var(--accent);
      font-weight: 700;
      text-decoration: none;
    }

    .breadcrumbs a:hover { text-decoration: underline; }
    .breadcrumbs [aria-current="page"] { overflow: hidden; text-overflow: ellipsis; }
    .breadcrumb-separator { color: var(--muted); }

    .summary { color: var(--muted); font-size: 0.82rem; }

    .browser-meta {
      display: flex;
      flex: 0 0 auto;
      align-items: center;
      gap: 12px;
    }

    .json-link {
      border-radius: 999px;
      padding: 3px 9px;
      background: var(--accent-soft);
      color: var(--accent);
      font-family: ui-monospace, "SFMono-Regular", Consolas, monospace;
      font-size: 0.72rem;
      font-weight: 750;
      text-decoration: none;
    }

    .json-link:hover { text-decoration: underline; }
    .listing-wrap { overflow-x: auto; }

    .listing {
      min-width: 520px;
      width: 100%;
      font-size: 0.9rem;
    }

    .listing-items { margin: 0; padding: 0; list-style: none; }

    .listing-header, .listing-row {
      display: grid;
      grid-template-columns: minmax(0, 1fr) 210px 110px;
    }

    .listing-header > span {
      padding: 12px 20px;
      color: var(--muted);
      font-size: 0.7rem;
      font-weight: 750;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }

    .listing-row {
      min-height: 56px;
      border-top: 1px solid var(--border);
      color: var(--muted);
      text-decoration: none;
      transition: background-color 120ms ease;
    }

    .listing-row:hover { background: var(--row-hover); }
    .listing-row:focus-visible { border-radius: 4px; outline: 2px solid var(--accent); outline-offset: -3px; }

    .listing-cell {
      display: flex;
      min-width: 0;
      align-items: center;
      padding: 8px 20px;
      white-space: nowrap;
    }

    .visually-hidden {
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border: 0;
    }

    .entry {
      max-width: min(560px, 58vw);
      gap: 12px;
      color: var(--text);
      font-weight: 620;
    }

    .entry-name { overflow: hidden; text-overflow: ellipsis; }
    .listing-row:hover .entry-name { color: var(--accent); text-decoration: underline; }

    .entry-icon {
      position: relative;
      display: inline-block;
      flex: 0 0 18px;
      width: 18px;
      height: 18px;
    }

    .entry-icon--folder {
      height: 13px;
      margin-top: 3px;
      border-radius: 3px;
      background: var(--folder);
    }

    .entry-icon--folder::before {
      position: absolute;
      top: -4px;
      left: 1px;
      width: 8px;
      height: 5px;
      border-radius: 3px 3px 0 0;
      background: var(--folder);
      content: "";
    }

    .entry-icon--file { border: 2px solid var(--file); border-radius: 3px; }

    .entry-icon--file::after {
      position: absolute;
      right: 2px;
      bottom: 3px;
      left: 2px;
      height: 2px;
      background: var(--file);
      box-shadow: 0 -4px 0 var(--file);
      content: "";
    }

    .entry-icon--parent {
      display: grid;
      place-items: center;
      border-radius: 5px;
      background: var(--accent-soft);
      color: var(--accent);
      font-size: 0.85rem;
      font-weight: 800;
    }

    .parent-row .entry { color: var(--muted); font-weight: 560; }

    .type-label {
      display: inline-block;
      border-radius: 999px;
      padding: 2px 8px;
      background: var(--accent-soft);
      color: var(--accent);
      font-size: 0.72rem;
      font-weight: 700;
    }

    .empty-state {
      display: grid;
      height: 120px;
      place-items: center;
      border-top: 1px solid var(--border);
      text-align: center;
    }

    .browser-footer {
      display: flex;
      justify-content: flex-end;
      padding: 14px 20px;
      border-top: 1px solid var(--border);
      background: var(--surface-strong);
    }

    .browser-footer:empty { display: none; }
    .next-page { color: var(--accent); font-size: 0.86rem; font-weight: 700; text-decoration: none; }
    .next-page:hover { text-decoration: underline; }

    @media (prefers-color-scheme: dark) {
      :root {
        --background: #0b0e15;
        --background-accent: #201a43;
        --surface: rgba(20, 24, 35, 0.9);
        --surface-strong: #151923;
        --text: #f3f4f8;
        --muted: #9ba4b5;
        --border: #2b3240;
        --accent: #a997ff;
        --accent-soft: #292443;
        --folder: #9b87ff;
        --file: #8590a4;
        --row-hover: #1d2030;
        --shadow: 0 28px 80px rgba(0, 0, 0, 0.4);
      }
    }

    @media (max-width: 640px) {
      .shell { width: min(100% - 24px, 960px); padding: 24px 0; }
      .browser-header { align-items: flex-start; flex-direction: column; gap: 6px; }
      .browser-meta { width: 100%; justify-content: space-between; }
      .listing-header, .listing-row { grid-template-columns: minmax(0, 1fr) 190px 92px; }
      .listing-header > span, .listing-cell { padding-right: 14px; padding-left: 14px; }
      .entry { max-width: calc(100vw - 150px); }
    }
  </style>
</head>
<body>
  <main class="shell">
    <section class="browser" aria-label="Directory contents">
      <div class="browser-header">
        <nav class="breadcrumbs" aria-label="Breadcrumb">${breadcrumbHtml(page.prefix)}</nav>
        <div class="browser-meta"><span class="summary">${summary}</span><a class="json-link" href="${page.pathname}?format=json${jsonCursor}">JSON</a></div>
      </div>
      <div class="listing-wrap">
        <div class="listing">
          <div class="listing-header"><span>Name</span><span>Last modified</span><span>Size</span></div>
          <ul class="listing-items" aria-label="Directory entries">${rows.join('')}</ul>
        </div>
      </div>
      <div class="browser-footer">${next}</div>
    </section>
  </main>
</body>
</html>`,
    nonce,
  };
}

/**
 * @param {Request} request
 * @param {ReturnType<typeof directoryPage>} page
 */
function jsonListingResponse(request, page) {
  let next = page.nextCursor
    ? new URL(`${page.pathname}?format=json&cursor=${encodeURIComponent(page.nextCursor)}`, page.url).href
    : null;
  return jsonResponse(request, {
    schemaVersion: 1,
    directory: {
      prefix: page.prefix,
      url: page.url,
    },
    directories: page.directories.map(directory => ({
      name: directory.name,
      prefix: directory.prefix,
      url: directory.url,
    })),
    files: page.files.map(file => ({
      name: file.name,
      key: file.key,
      url: file.url,
      size: file.size,
      uploaded: file.uploaded.toISOString(),
      etag: file.etag,
    })),
    next,
  });
}

/**
 * @param {Request} request
 * @param {R2Bucket} bucket
 * @param {string} key
 */
async function localObjectResponse(request, bucket, key) {
  let object = await bucket.get(key);
  if (!object) {
    return textErrorResponse(request, 404, 'Object not found');
  }

  let headers = new Headers;
  object.writeHttpMetadata(headers);
  headers.set('Cache-Control', 'no-store');
  headers.set('ETag', object.httpEtag);
  return new Response(request.method === 'HEAD' ? null : object.body, { headers });
}

export default {
  async fetch(request, env) {
    let url = new URL(request.url);
    let localDevelopment = env.LOCAL_DEVELOPMENT === 'true';

    if (!['GET', 'HEAD'].includes(request.method)) {
      return errorResponse(request, 405, 'method_not_allowed', 'Method not allowed', {
        Allow: 'GET, HEAD',
      });
    }

    let encodedPath;
    if (url.pathname.startsWith(`${INTERNAL_PREFIX}/`)) {
      encodedPath = url.pathname.slice(INTERNAL_PREFIX.length + 1);
    } else if (localDevelopment && url.pathname.endsWith('/')) {
      encodedPath = url.pathname.slice(1);
    } else if (localDevelopment) {
      let key;
      try {
        key = decodeURIComponent(url.pathname.slice(1));
      } catch {
        return errorResponse(request, 400, 'invalid_path', 'Invalid path');
      }
      return localObjectResponse(request, env.ASSETS, key);
    } else {
      return errorResponse(request, 404, 'not_found', 'Not found');
    }

    let prefix;
    try {
      prefix = decodeURIComponent(encodedPath);
    } catch {
      return errorResponse(request, 400, 'invalid_path', 'Invalid path');
    }

    let format = url.searchParams.get('format');
    if (format && format !== 'json') {
      return jsonErrorResponse(request, 400, 'unsupported_format', 'Unsupported format');
    }

    let cursor = url.searchParams.get('cursor') || undefined;
    let listing;
    try {
      listing = await env.ASSETS.list({
        cursor,
        delimiter: '/',
        limit: PAGE_SIZE,
        prefix,
      });
    } catch (error) {
      console.error(JSON.stringify({
        error: error instanceof Error ? error.message : String(error),
        message: 'R2 directory listing failed',
        prefix,
      }));
      return errorResponse(request, 500, 'listing_unavailable', 'Directory listing unavailable');
    }

    if (prefix && !listing.objects.length && !listing.delimitedPrefixes.length) {
      return errorResponse(request, 404, 'directory_not_found', 'Directory not found');
    }

    let page = directoryPage(url.origin, prefix, listing, cursor);
    if (format === 'json') {
      return jsonListingResponse(request, page);
    }

    let listingHtml = renderListing(page);
    return new Response(request.method === 'HEAD' ? null : listingHtml.body, {
      headers: {
        'Cache-Control': 'no-store',
        'Content-Security-Policy': `default-src 'none'; style-src 'nonce-${listingHtml.nonce}'; base-uri 'none'; frame-ancestors 'none'`,
        'Content-Type': 'text/html; charset=utf-8',
        'X-Content-Type-Options': 'nosniff',
        'X-Robots-Tag': 'noindex',
      },
    });
  },
};

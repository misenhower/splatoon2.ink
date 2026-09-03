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
    crumbs.push('<span aria-hidden="true">/</span>');
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
    rows.push(`<li><a class="entry parent" href="${parentPath(page.prefix)}"><span>Parent directory</span><span></span><span>Folder</span></a></li>`);
  }
  for (let directory of page.directories) {
    rows.push(`<li><a class="entry" href="${directory.pathname}"><span>${escapeHtml(directory.name)}</span><span></span><span>Folder</span></a></li>`);
  }
  for (let file of page.files) {
    rows.push(`<li><a class="entry" href="${file.pathname}"><span>${escapeHtml(file.name)}</span><time datetime="${file.uploaded.toISOString()}">${formatDate(file.uploaded)}</time><span>${formatSize(file.size)}</span></a></li>`);
  }
  if (!rows.length) {
    rows.push('<li class="empty">This directory is empty.</li>');
  }

  let jsonCursor = page.requestedCursor
    ? `&amp;cursor=${encodeURIComponent(page.requestedCursor)}`
    : '';
  let next = page.nextCursor
    ? `<a class="next" rel="next" href="${page.pathname}?cursor=${encodeURIComponent(page.nextCursor)}">Next page →</a>`
    : '';
  let title = `Asset browser — ${page.pathname}`;
  let nonce = crypto.randomUUID().replaceAll('-', '');

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
    :root { color-scheme: light dark; font-family: ui-sans-serif, system-ui, sans-serif; }
    body { max-width: 64rem; margin: 0 auto; padding: 2rem; background: #f3f5f9; color: #18202f; }
    main { overflow: hidden; border: 1px solid #dce1ea; border-radius: 1rem; background: #fff; box-shadow: 0 1.5rem 4rem #261d521f; }
    header, footer { display: flex; align-items: center; justify-content: space-between; gap: 1rem; padding: 1rem 1.25rem; }
    nav { display: flex; gap: .5rem; overflow: hidden; font: .9rem ui-monospace, monospace; white-space: nowrap; }
    nav a, .next { color: #6047d9; font-weight: 700; }
    ul { min-width: 34rem; margin: 0; padding: 0; list-style: none; }
    .entry { display: grid; grid-template-columns: minmax(0, 1fr) 14rem 7rem; gap: 1rem; padding: 1rem 1.25rem; border-top: 1px solid #dce1ea; color: inherit; text-decoration: none; }
    .entry:hover { background: #f7f5ff; }
    .parent { color: #657084; }
    .empty { padding: 2rem 1.25rem; border-top: 1px solid #dce1ea; color: #657084; text-align: center; }
    .summary { color: #657084; font-size: .85rem; white-space: nowrap; }
    footer:empty { display: none; }
    @media (prefers-color-scheme: dark) { body { background: #0b0e15; color: #f3f4f8; } main { border-color: #2b3240; background: #151923; } .entry { border-color: #2b3240; } .entry:hover { background: #1d2030; } nav a, .next { color: #a997ff; } }
  </style>
</head>
<body>
  <main>
    <header><nav aria-label="Breadcrumb">${breadcrumbHtml(page.prefix)}</nav><span class="summary">${page.directories.length} folders · ${page.files.length} files · <a href="${page.pathname}?format=json${jsonCursor}">JSON</a></span></header>
    <ul aria-label="Directory entries">${rows.join('')}</ul>
    <footer>${next}</footer>
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

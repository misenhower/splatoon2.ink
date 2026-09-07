import { logMessage } from '../log.js';
import { fetchWithTimeout } from '../../common/fetch.js';
import { screenshotReadySelector } from '../../common/screenshot.js';

// Screenshots of the site's screenshot page, rendered by Cloudflare Browser Rendering's REST
// API. It is plain fetch, so the same code runs under Node and in a Worker. The page is the
// deployed one (SITE_URL), which reads the published data.
//
// Configuration (environment variables / Worker secrets):
//   SITE_URL                          e.g. https://splatoon2.ink
//   CLOUDFLARE_ACCOUNT_ID
//   CLOUDFLARE_BROWSER_RUN_API_TOKEN  an API token with Browser Rendering permission

const viewport = {
    // Use a 16:9 ratio for the public social image.
    // 1216 was chosen as the width because of Bulma's "widescreen" breakpoint
    width: 1216,
    height: 684,
    deviceScaleFactor: 2,
};

function config() {
    let names = ['SITE_URL', 'CLOUDFLARE_ACCOUNT_ID', 'CLOUDFLARE_BROWSER_RUN_API_TOKEN'];
    let missing = names.filter(name => !process.env[name]);
    if (missing.length)
        throw new Error(`Missing screenshot configuration: ${missing.join(', ')}`);

    return {
        siteUrl: process.env.SITE_URL,
        accountId: process.env.CLOUDFLARE_ACCOUNT_ID,
        apiToken: process.env.CLOUDFLARE_BROWSER_RUN_API_TOKEN,
    };
}

async function errorMessage(response) {
    let body = await response.text();

    try {
        let messages = JSON.parse(body).errors?.map(error => error.message).filter(Boolean);
        if (messages?.length)
            return messages.join('; ');
    } catch {
        // Not JSON; use the body as-is
    }

    return body || response.statusText || 'Unknown error';
}

/**
 * @param {{ hash: string, viewport?: object }} options
 * @returns {Promise<{ image: Uint8Array, type: string, width: number, height: number }>}
 */
export async function captureScreenshot({ hash, viewport: viewportOverrides }) {
    let { siteUrl, accountId, apiToken } = config();
    let thisViewport = Object.assign({}, viewport, viewportOverrides);

    let url = new URL('/screenshots.html', siteUrl);
    url.hash = hash;

    let endpoint = new URL(`/client/v4/accounts/${accountId}/browser-rendering/screenshot`, 'https://api.cloudflare.com');
    endpoint.searchParams.set('cacheTTL', '0');

    let request = {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiToken}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            url: url.toString(),
            viewport: thisViewport,
            gotoOptions: { waitUntil: 'domcontentloaded', timeout: 10_000 },
            waitForSelector: { selector: screenshotReadySelector, timeout: 10_000 },
            actionTimeout: 10_000,
            setExtraHTTPHeaders: { 'Cache-Control': 'no-cache' },
            screenshotOptions: { type: 'png' },
        }),
    };
    let image;
    for (let attempt = 0; attempt <= 3; attempt++) {
        try {
            // Three 10s browser phases plus transport overhead; covers response body too.
            let response = await fetchWithTimeout(endpoint, request, 40_000);
            if (!response.ok) {
                let message = await errorMessage(response);
                let error = new Error(`Browser Rendering screenshot failed (${response.status}): ${message}`);
                // Browser Run reports navigation/selector/action timeouts as 422 errors.
                error.retryable = response.status === 408 || response.status >= 500
                    || (response.status === 422 && /timeout|timed out/i.test(message));
                throw error;
            }
            image = new Uint8Array(await response.arrayBuffer());
            break;
        } catch (error) {
            let retryable = error.retryable ?? ['TimeoutError', 'TypeError'].includes(error.name);
            if (!retryable || attempt === 3)
                throw error;
            let delayMs = 500 * 2 ** attempt;
            logMessage('warn', 'Retrying Browser Run screenshot', { attempt: attempt + 1, delayMs, error: error.message });
            await new Promise(resolve => setTimeout(resolve, delayMs));
        }
    }

    return {
        image,
        type: 'image/png',
        width: thisViewport.width * thisViewport.deviceScaleFactor,
        height: thisViewport.height * thisViewport.deviceScaleFactor,
    };
}

export function captureScheduleScreenshot(now) {
    let hash = `/schedules/${now}`;

    return captureScreenshot({ hash });
}

export function captureGearScreenshot(now) {
    let hash = `/splatNetGear/${now}`;

    return captureScreenshot({ hash });
}

export function captureSalmonRunScreenshot(now, mode) {
    let hash = `/salmonRun/${now}?mode=${mode}`;

    return captureScreenshot({ hash });
}

export function captureSalmonRunGearScreenshot(now) {
    let hash = `/salmonRunGear/${now}`;

    return captureScreenshot({ hash });
}

export function captureNewWeaponScreenshot(now, weaponCount) {
    let hash = `/newWeapon/${now}`;

    // There are a max of 4 weapons per row
    const rows = Math.ceil(weaponCount / 4);
    // Determine the image height based on the number of rows
    let height = rows * 320;
    // Add some extra height for the bottom banner
    height += 60;
    // Set a minimum overall image height
    height = Math.max(height, 700);

    return captureScreenshot({ hash, viewport: { height } });
}

export function captureSplatfestScreenshot(region, now, regions) {
    regions = regions.join(',');
    let hash = `/splatfest/${region}/${now}?regions=${regions}`;

    return captureScreenshot({ hash });
}

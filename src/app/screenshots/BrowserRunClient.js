import { logMessage } from '../log.js';
import { fetchWithTimeout } from '../../common/fetch.js';

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

// Browser Run's REST client works in both Node and Workers.
export default class BrowserRunClient {
    constructor({ accountId, apiToken }) {
        this.accountId = accountId;
        this.apiToken = apiToken;
    }

    async capture({ url, viewport, readySelector }) {
        let missing = [];
        if (!this.accountId)
            missing.push('CLOUDFLARE_ACCOUNT_ID');
        if (!this.apiToken)
            missing.push('CLOUDFLARE_BROWSER_RUN_API_TOKEN');
        if (missing.length)
            throw new Error(`Missing screenshot configuration: ${missing.join(', ')}`);

        let endpoint = new URL(`/client/v4/accounts/${this.accountId}/browser-rendering/screenshot`, 'https://api.cloudflare.com');
        endpoint.searchParams.set('cacheTTL', '0');

        let request = {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.apiToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                url: url.toString(),
                viewport,
                gotoOptions: { waitUntil: 'domcontentloaded', timeout: 10_000 },
                waitForSelector: { selector: readySelector, timeout: 10_000 },
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
        return image;
    }
}

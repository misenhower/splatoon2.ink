import { logMessage } from '../log.js';

async function errorMessage(response) {
    let body = await response.text();

    try {
        let messages = JSON.parse(body)
            .errors?.map(error => error.message)
            .filter(Boolean);

        if (messages?.length)
            return messages.join('; ');
    } catch {
        // Not JSON; use the body as-is
    }

    return body || response.statusText || 'Unknown error';
}

// Browser Run captures remotely through the Worker's Browser binding.
export default class BrowserRunRenderer {
    constructor(browser) {
        this.browser = browser;
    }

    async capture({ url, viewport, readySelector }) {
        let options = {
            url: url.toString(),
            viewport,
            cacheTTL: 0,
            gotoOptions: { waitUntil: 'domcontentloaded', timeout: 10_000 },
            waitForSelector: { selector: readySelector, timeout: 10_000 },
            actionTimeout: 10_000,
            setExtraHTTPHeaders: { 'Cache-Control': 'no-cache' },
            screenshotOptions: { type: 'png' },
        };
        let image;

        for (let attempt = 0; attempt <= 3; attempt++) {
            try {
                let response = await this.browser.quickAction('screenshot', options);

                if (!response.ok) {
                    let message = await errorMessage(response);
                    let error = new Error(
                        `Browser Rendering screenshot failed (${response.status}): ${message}`,
                    );

                    // Browser Run reports navigation/selector/action timeouts as 422 errors.
                    error.retryable =
                        response.status === 408 ||
                        response.status >= 500 ||
                        (response.status === 422 && /timeout|timed out/i.test(message));
                    throw error;
                }

                image = new Uint8Array(await response.arrayBuffer());
                break;
            } catch (error) {
                let retryable = error.retryable ?? ['TimeoutError', 'TypeError'].includes(error.name);

                if (!retryable || attempt === 3)
                    throw error;

                let delayMs = 500 * 2 ** attempt;

                logMessage('warn', 'Retrying Browser Run screenshot', {
                    attempt: attempt + 1,
                    delayMs,
                    error: error.message,
                });
                await new Promise(resolve => setTimeout(resolve, delayMs));
            }
        }

        return image;
    }
}

import { screenshotReadySelector } from '../../common/screenshot.js';

export const defaultViewport = {
    // Use a 16:9 ratio for the public social image.
    // 1216 was chosen as the width because of Bulma's "widescreen" breakpoint
    width: 1216,
    height: 684,
    deviceScaleFactor: 2,
};

// Routes and image dimensions are shared regardless of where the browser runs.
export default class ScreenshotGenerator {
    constructor(renderer, siteUrl) {
        this.renderer = renderer;
        this.siteUrl = siteUrl;
    }

    async capture({ hash, url, viewport = {} }) {
        if (!url) {
            if (!this.siteUrl)
                throw new Error('SITE_URL is required to capture a screenshot route.');
            url = new URL('/screenshots.html', this.siteUrl);
            url.hash = hash;
        }
        let captureViewport = { ...defaultViewport, ...viewport };
        let image = await this.renderer.capture({
            url: new URL(url).toString(),
            viewport: captureViewport,
            readySelector: screenshotReadySelector,
        });
        return {
            image,
            type: 'image/png',
            width: captureViewport.width * captureViewport.deviceScaleFactor,
            height: captureViewport.height * captureViewport.deviceScaleFactor,
        };
    }

    captureScheduleScreenshot(now) {
        let hash = `/schedules/${now}`;

        return this.capture({ hash });
    }

    captureGearScreenshot(now) {
        let hash = `/splatNetGear/${now}`;

        return this.capture({ hash });
    }

    captureSalmonRunScreenshot(now, mode) {
        let hash = `/salmonRun/${now}?mode=${mode}`;

        return this.capture({ hash });
    }

    captureSalmonRunGearScreenshot(now) {
        let hash = `/salmonRunGear/${now}`;

        return this.capture({ hash });
    }

    captureNewWeaponScreenshot(now, weaponCount) {
        let hash = `/newWeapon/${now}`;

        // There are a max of 4 weapons per row
        const rows = Math.ceil(weaponCount / 4);
        // Determine the image height based on the number of rows
        let height = rows * 320;
        // Add some extra height for the bottom banner
        height += 60;
        // Set a minimum overall image height
        height = Math.max(height, 700);

        return this.capture({ hash, viewport: { height } });
    }

    captureSplatfestScreenshot(region, now, regions) {
        regions = regions.join(',');
        let hash = `/splatfest/${region}/${now}?regions=${regions}`;

        return this.capture({ hash });
    }
}

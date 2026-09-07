export const screenshotReadyAttribute = 'data-screenshot-ready';
export const screenshotReadySelector = `[${screenshotReadyAttribute}="true"]`;

// The page owns readiness: fetching data alone does not mean Vue, fonts, and images
// have finished rendering. A superseded route must never mark a newer route ready.
export async function markScreenshotReady({
    loadData,
    nextTick,
    isCurrent = () => true,
    document = globalThis.document,
    requestAnimationFrame = globalThis.requestAnimationFrame,
}) {
    document.documentElement.removeAttribute(screenshotReadyAttribute);
    let results = await loadData();
    if (results.some(result => result.status === 'rejected'))
        throw new Error('Screenshot data failed to load');
    await nextTick();
    await document.fonts?.ready;
    await Promise.allSettled([...document.images].map(image => image.decode()));
    await new Promise(resolve => requestAnimationFrame(resolve));
    await new Promise(resolve => requestAnimationFrame(resolve));
    if (isCurrent())
        document.documentElement.setAttribute(screenshotReadyAttribute, 'true');
}

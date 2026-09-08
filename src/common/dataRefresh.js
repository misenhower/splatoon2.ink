// Refresh near the hour, retry each minute through :05, then every five minutes.
// Jitter spreads open tabs out without assuming the publisher meets a fixed deadline.
export function nextDataRefreshAt(now = Date.now(), jitter = Math.floor(Math.random() * 35)) {
    let candidate = new Date(now);
    candidate.setSeconds(25 + jitter, 0);

    while (candidate.getTime() <= now || (candidate.getMinutes() > 5 && candidate.getMinutes() % 5 !== 0))
        candidate.setMinutes(candidate.getMinutes() + 1);

    return candidate.getTime();
}

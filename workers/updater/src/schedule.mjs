// Time math for the alarm scheduler. The hourly job runs ten seconds past the top of the
// hour, the moment the container's node-cron ran at.

export const HOUR_MS = 60 * 60 * 1000;
export const GRACE_MS = 10 * 1000;

/** The :00:10 strictly after `now`. */
export function nextRunAt(now = Date.now()) {
  let candidate = now - (now % HOUR_MS) + GRACE_MS;
  return candidate > now ? candidate : candidate + HOUR_MS;
}

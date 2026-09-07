# Splatoon 2 updater Worker

Runs the site's updaters (`src/app/updater`, the same code `npm run splatnet` runs
locally) on Cloudflare, writing to R2 through `BucketStorage` instead of to `dist/`
and `storage/` through `FilesystemStorage`.

## Scheduling: cron wakes, the object works

Cron Triggers fire anywhere inside their minute (observed about 55 seconds late)
and execute in whichever colo Cloudflare chooses; placement hints only apply to
fetch handlers. So Cron Triggers never do work here. They call the `Scheduler`
Durable Object, which runs jobs from its own alarm, in place, next to the R2
buckets (the stub is created with a `wnam` location hint).

- **Hourly jobs** (`updaters`, then `posters`): the full updater run followed by
  the social posters, from an alarm at :00:10, re-armed for the next hour after
  each run. A run with a failed job is retried after a minute, up to three
  times, before falling back to the next hour. Alarms have measured about 1 ms
  of drift.
- **Woken jobs**: `wake(job)` asks the object to run a job as soon as possible.
  The scheduled handler maps each cron expression in `CRON_ACTIONS` to a call on
  the object; this is how a cron-driven job is expressed.
- **Watchdog**: the only cron trigger, at minute 30, calls `ensureArmed()` so a
  lost hourly alarm heals within the hour. The alarm handler also restores the
  hourly schedule itself if it finds it missing.

Every run logs a structured summary (`driftMs`, `runMs`, per-updater results,
the colo) under `updater: "alarm"`, visible in the Worker's Observability tab.
`GET /status` returns the last run of each job.

## Social posters

The posters (`src/app/twitter`) read the published data from the public bucket,
keep their state (last post times per platform, the previous Salmon Run shift)
in the private bucket, render screenshots of the deployed site through
Cloudflare Browser Rendering, and post to Bluesky and Twitter. With no social
credentials set they only render and save the public images
(`twitter-images/`), which is the shadow mode used before cutover.

## Errors

The shared updater code reports through `@sentry/core`; this Worker wraps its
handlers and the Durable Object with `@sentry/cloudflare`, so those reports go
to Sentry when the `SENTRY_DSN` secret is set and nowhere otherwise.

## Shadow mode

`wrangler.jsonc` points the `ASSETS` binding at `splatoon2-ink-dev-assets` while
the container still owns `splatoon2-ink-assets`. Cutover is changing that
`bucket_name`. Compare the two buckets' `data/` with `scripts/compare-data.mjs`
after downloading, e.g. with `wrangler r2 object get --remote`.

## Secrets

```sh
npx wrangler secret put NINTENDO_SESSION_ID_NA --config workers/updater/wrangler.jsonc
npx wrangler secret put NINTENDO_SESSION_ID_EU --config workers/updater/wrangler.jsonc
npx wrangler secret put NINTENDO_SESSION_ID_JP --config workers/updater/wrangler.jsonc
npx wrangler secret put SPLATNET_USER_AGENT   --config workers/updater/wrangler.jsonc
npx wrangler secret put RUN_TOKEN             --config workers/updater/wrangler.jsonc
npx wrangler secret put CLOUDFLARE_BROWSER_RUN_API_TOKEN --config workers/updater/wrangler.jsonc  # screenshots
npx wrangler secret put SENTRY_DSN            --config workers/updater/wrangler.jsonc   # optional
# At cutover, the social credentials: BLUESKY_SERVICE, BLUESKY_IDENTIFIER, BLUESKY_PASSWORD,
# TWITTER_CONSUMER_KEY, TWITTER_CONSUMER_SECRET, TWITTER_ACCESS_TOKEN_KEY, TWITTER_ACCESS_TOKEN_SECRET
```

The updaters read the SplatNet secrets through `process.env`, which Workers
populate from the bindings. For local development put the same names in
`workers/updater/.dev.vars` (gitignored).

## Running

```sh
npm run updater:test            # vitest in workerd: the updaters against local R2, the Scheduler
npm run updater:dev             # local dev; GET http://localhost:8787/cdn-cgi/handler/scheduled fires the cron
npm run updater:deploy:dry-run
npm run updater:deploy
npm run updater:tail            # live logs
```

Authenticated operator endpoints, all requiring `Authorization: Bearer $UPDATER_RUN_TOKEN`
(the token is in `.env` locally); without `RUN_TOKEN` set they are off:

```sh
BASE=https://splatoon2-ink-updater.<subdomain>.workers.dev
curl -X POST -H "Authorization: Bearer $UPDATER_RUN_TOKEN" "$BASE/run"                       # run every updater now
curl -X POST -H "Authorization: Bearer $UPDATER_RUN_TOKEN" "$BASE/run?only=Schedules,Timeline"  # or some of them
curl -X POST -H "Authorization: Bearer $UPDATER_RUN_TOKEN" "$BASE/post"                      # run the social posters now
curl -X POST -H "Authorization: Bearer $UPDATER_RUN_TOKEN" "$BASE/wake?job=updaters"          # ask the Scheduler to run a job now (or job=posters)
curl -X POST -H "Authorization: Bearer $UPDATER_RUN_TOKEN" "$BASE/arm"                       # schedule the hourly job if it is not scheduled
curl        -H "Authorization: Bearer $UPDATER_RUN_TOKEN" "$BASE/status"                    # alarm time, hourly/retry state, last run per job
curl        -H "Authorization: Bearer $UPDATER_RUN_TOKEN" "$BASE/list?prefix=data/"         # keys in the public bucket under a prefix (wrangler cannot list objects)
```

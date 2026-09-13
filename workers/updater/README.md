# Splatoon 2 updater Worker

Runs the existing updaters and Bluesky posts on Cloudflare. `BucketStorage` uses
R2 instead of the local runner's `dist/` and `storage/` directories. Private
state stays in R2; no database migration is needed.

## Scheduling and manual runs

One `Scheduler` Durable Object owns the update → social pipeline. Its alarm
targets ten seconds past each hour, matching the old Node cron. Alarms normally
have low drift, but maintenance/failover can delay them; this is not a hard
real-time deadline. The `wnam` location hint is best effort and correctness does
not depend on where the object runs. There is no per-run colo probe.

- The pipeline runs all updaters and posts only if all succeed.
- A failed hourly pipeline retries after one minute, up to three retries, then
  returns to the next hour. Successful posts keep their existing per-post
  Bluesky timestamps so a retry skips them.
- The minute-30 cron checks/re-arms the alarm. The object may sleep between
  alarms; the watchdog repairs scheduling, rather than keeping a process alive.
- Manual runs use the same object. A request during an active run returns HTTP
  409; retry it later. The admin panel can persist one background manual request.
  There is no `/wake` or `/post` endpoint. An hourly alarm that encounters a
  manual run remains due.
- `POST /run` runs the complete pipeline and waits for its result. With `only`,
  it repairs the named updaters and skips social posting. Unknown names fail.
- The existing object name and hourly/retry state survive deployment. Pending
  requests from the old scheduler become one full run before normal scheduling
  resumes.

`GET /status` reports the due time, retries, last hourly run, last manual run,
and whether the object is busy. Run summaries include actual start/completion
information, updater results and per-post/client social outcomes. HTTP runs
return 200 for success, 409 when busy, or 502 for a failed pipeline. Storage/RPC
errors return 500. Inspect the response body and Worker logs for details.

Only one backend may write production at a time. Coordination in this Worker
does not serialize it with the old server or a locally started runner. A social
API accepting a post followed by a failed timestamp write still leaves an
ambiguous outcome; storage cannot make those two external operations atomic.

## Social posts and screenshots

`src/app/social` posts to Bluesky. Twitter/X support and its dependency have
been removed. Local commands are `npm run social` and `npm run social:test`.

The existing `bluesky-lastPostTimes.json`, `salmonrun-previousSchedule.json`,
and `stages.json` keys are preserved. Public images remain at `twitter-images/`
to preserve existing URLs; that legacy directory name does not enable X posting.
With no Bluesky credentials the runner generates public images only. Shadow
runs still update some private state, including the remembered Salmon Run shift.

Each post captures one PNG. The public copy stays in R2; when Bluesky needs
JPEG, the Worker's `IMAGES` binding converts those same PNG bytes at quality 90.
The local Node runner uses `sharp` through a conditional package import, keeping
native dependencies out of the Worker bundle. Conversion failures fail that
client's post without advancing its timestamp; no second browser capture is used.
Public-image-only shadow runs do not request conversions.

The Images Free plan includes 5,000 unique transformations per month; on that
plan, new transformations beyond the quota fail instead of incurring charges.
This uses transformations only, not paid Images storage. See
[Images pricing](https://developers.cloudflare.com/images/pricing/).

Browser Rendering opens `SITE_URL/screenshots.html`. Before rendering or
posting, the Worker compares that site's five data JSON files and English
localization against its own public bucket. A mismatch fails the run so the
scheduler can retry. Point `SITE_URL` at a preview site serving the dev bucket
to validate shadow output; production is suitable only when its data matches.
The screenshot request asks the browser to revalidate cached resources. The
preflight validates JSON, not pixel output or an atomic snapshot across a CDN.
Visually check generated images before cutover.

Nintendo, Bluesky, and rendering-site checks have 30-second network deadlines,
including body consumption. Browser Rendering uses 10-second navigation, page-ready, and capture limits,
through the Browser binding. It waits for
`data-screenshot-ready="true"` after data, Vue rendering, fonts, images and layout
settle, instead of waiting for network idle. Deploy the updated screenshot page
before the Worker that requires this marker.

Transient screenshot errors (timeouts, network failures, and HTTP 5xx) get up to
three retries after the first attempt, with 0.5/1/2-second backoff. Authentication,
rate-limit and non-timeout validation errors fail immediately. These retries only
repeat rendering, never the social send; exhausted failures still reach the hourly
pipeline's bounded retry mechanism. Errors are reported rather than logged
as successful social runs.

## Local screenshots and Browser Run testing

Node commands use Puppeteer; the Worker uses `BrowserRunRenderer` with its
`BROWSER` binding. `ScreenshotGenerator` owns the shared routes, viewport, and
page-ready selector; either renderer returns PNG bytes. No API token or account
ID is needed for screenshots, and no package import conditions select renderers.

With Puppeteer, leave `SITE_URL` empty to temporarily serve the built `dist/`
on loopback. Run `npm run build` first and provide the usual data/assets in
`dist/`. Puppeteer installs its own Chrome; Browserless is not required.
Set `SITE_URL=http://127.0.0.1:8080` to use `npm run serve` instead. The Vue dev
server already serves data/assets from `dist/`; keep those files aligned with
the data the social test reads. Local rendering waits for the page-ready signal
and uses 10-second navigation, readiness, and browser-protocol timeouts.

```sh
# Generate the social test images against the local build.
SITE_URL= npm run social:test

# Capture one route; replace the timestamp with a rotation in your data.
SITE_URL= npm run screenshot -- \
  --hash '/schedules/1788652800' --output dist/test-screenshots/schedule.png

# Capture a running dev server directly.
npm run screenshot -- \
  --url 'http://127.0.0.1:8080/screenshots.html#/schedules/1788652800'

# Start the capture-only Worker locally, with a remote Browser binding.
npm run screenshot:cloudflare

# In another terminal, save a capture from a publicly reachable screenshot page.
curl --fail-with-body --get 'http://127.0.0.1:8789/' \
  --data-urlencode 'url=https://dev.splatoon2.ink/screenshots.html#/schedules/1788652800' \
  --output /tmp/cloudflare.png
```

`npm run screenshot` loads `.env`, accepts either `--url` or `--hash`, and saves
a PNG using local Chrome. `--hash` uses `SITE_URL` or the temporary dist server.

`npm run screenshot:cloudflare` runs the small `workers/screenshots` entry point
through Wrangler. Sign in with `npx wrangler login` if needed. Only the browser
runs remotely; the capture endpoint listens on loopback port 8789. This entry
point is for local development, not deployment. Cloudflare cannot reach localhost:
use a deployed preview or tunnel for an unpublished frontend. Remote captures
use the account's Browser Run allowance.

Both paths are capture-only: no updates, social sends, checkpoints, dataset
comparisons, or JPEG conversion. All screenshot pages must provide the readiness
marker. The updater's social pipeline retains its published-data checks.

## Shadow testing and cutover

The `dev` environment deploys `splatoon2-ink-dev-updater`, using
`splatoon2-ink-dev-assets`, `splatoon2-ink-dev-private`, and
`https://dev.splatoon2.ink`. The `production` environment deploys
`splatoon2-ink-updater`, using the production buckets and site. Each Worker owns
its own scheduler and secrets. Leave Bluesky credentials unset in dev.

The npm updater development, deployment, dry-run and tail commands select dev.
Use `npm run updater:deploy:production` for a manual production deployment.
Neither environment starts automatic scheduling on a fresh scheduler.

Cloudflare Workers Builds deploys pushes to `develop` to the dev Worker and
pushes to `main` to the production Worker. Both use these dashboard settings:

- Repository root: `/`
- Build command: `npm run lint -- --max-warnings 0 && npm test`
- Deploy command: `npx wrangler deploy --config workers/updater/wrangler.jsonc --env dev`
  for dev, or the same command with `--env production` for production
- Build variable: `NODE_VERSION=22`
- Preview builds for other branches: disabled

The frontend deploys separately through Cloudflare Pages. Deployments preserve
the stored scheduling toggle; they do not enable automatic updates.

Production cut over on September 13, 2026. The old backend is stopped, public
data and private checkpoints are in the production R2 buckets, and hourly
scheduling is enabled. The production admin panel is at
`https://admin.splatoon2.ink/`, protected by its own Access application using
the same owner-only policy as dev.

1. Run the tests, build, and deployment dry run below. Compare old/new public
   data using `scripts/compare-data.mjs` on downloaded bucket directories.
2. Serve the built frontend with `/data/` and `/assets/` backed by the dev
   bucket, then set `SITE_URL` to that preview site's origin. Keep Bluesky
   credentials unset. Run the full pipeline and visually inspect its images.
3. At cutover, stop the old scheduler and let its current run finish. Pause the
   shadow Worker before copying state: clearing the cron alone does **not**
   stop the object's existing alarms. Do not leave two writers active.
4. Copy the latest production private state (especially the Bluesky last-post
   times and previous Salmon Run shift) to the intended Worker private bucket.
   Preserve an old-state backup and the old deployment for rollback.
5. Set `ASSETS` to the production bucket, confirm `PRIVATE`, and set `SITE_URL`
   to the production site that serves that bucket. Add the Bluesky credentials.
   Deploy and arm the Worker; check its full run, data freshness, images, and
   next alarm. Deploy the frontend refresh changes as part of this rollout.
6. For rollback, stop the Worker/alarms before restarting the old backend.
   Transfer the latest Bluesky checkpoints back so already-sent posts remain
   recorded. Restore the prior site/data configuration as needed.

These are rollout steps, not actions performed by tests or a dry run. To stop
this Worker safely for cutover/rollback, use authenticated `POST /pause`; this
persists the pause and deletes the alarm. `/arm` resumes scheduling; a saved
overdue run executes immediately. Do not pause
in the middle of a run: a busy pause request returns 409 so the caller can retry.

## Admin panel

The admin panels at `https://admin.splatoon2.ink/` and
`https://admin.dev.splatoon2.ink/` provide data-only, social-only, and full
manual runs. The authenticated browser starts a persisted request and polls its
status; closing the tab does not cancel the job. One manual request can be
pending at a time, and it shares the hourly scheduler's lock. Social runs keep
normal checkpoints and the published-data check. An interrupted manual run is
reported as failed rather than automatically replaying an uncertain social send.
The hourly schedule is preserved. Paused scheduling also blocks manual runs.

The panel polls live application log lines every two seconds during a run and
retains the latest 50 manual and scheduled runs in one history, including failed
attempts. Older deployments contribute their two existing results. Each run
stores up to the latest 200 lines (500 characters each, 32 KB total) with its
final summary.
Known secret values are redacted from captured lines. This includes updater,
social, and screenshot-retry messages, not platform or third-party library logs.
Live lines are held in memory until completion; an isolate interruption can lose
those lines. Full operational logs remain available through Workers logging.

Preview the actual panel with simulated results using `npm run admin:preview`,
then open `http://127.0.0.1:8788/admin/`. This standalone preview server listens
only on loopback and has no production credentials or bindings. The production
Worker has no local-authentication bypass.

The dev admin hostname is attached as a Worker Custom Domain and protected by
the "Splatoon2 dev admin" Access application using the existing owner-only policy.
`ACCESS_TEAM_DOMAIN` and `ACCESS_AUD` are stored as Worker secrets to keep
account-specific configuration out of the public repository. `/admin/` remains
an alias; the panel API stays under `/admin/api/`.

For another deployment:

1. Create a Cloudflare Access self-hosted application protecting the entire
   chosen admin hostname. Allow only the
   owner's identity, with email one-time codes or their preferred provider.
2. Configure the updater with `ADMIN_HOSTNAME`, `ACCESS_TEAM_DOMAIN` (the bare
   `<team>.cloudflareaccess.com` hostname), and `ACCESS_AUD` (the application's
   audience tag). All admin routes fail closed without these settings.
3. Attach the admin hostname to this Worker and deploy. Open `/` and verify
   login, status, and a deliberate test run. No Access application or production
   admin domain is created by the local preview.

The Worker verifies JWT signature, issuer, audience, expiration, and hostname.
Mutating browser requests also require a matching Origin and JSON content type.
The existing bearer-token API remains available for scripts, independently of
Access. The panel exposes an **Automatic scheduling** toggle. Its value is saved in the
scheduler Durable Object and survives deployments. Turning it off clears the
hourly/retry schedule, but manual runs still work. The watchdog respects the
setting, so leave its cron configured. Turning it on schedules the next hour
at :00:10; missed hours are not replayed. Wait for an active or queued run to
finish before toggling.

The separate API-only `/pause` remains a maintenance stop: it also blocks manual
runs. `/arm` clears that maintenance pause without changing the automatic setting.
The panel does not expose force-repost or maintenance pause/resume controls.

## Configuration and local commands

Secrets: `NINTENDO_SESSION_ID_NA`, `NINTENDO_SESSION_ID_EU`,
`NINTENDO_SESSION_ID_JP`, optional `SPLATNET_USER_AGENT`, `RUN_TOKEN`,
optional `SENTRY_DSN`, and at cutover
`BLUESKY_SERVICE`, `BLUESKY_IDENTIFIER`, `BLUESKY_PASSWORD`.

Use `wrangler secret put NAME --config workers/updater/wrangler.jsonc --env dev` for a
secret. `SITE_URL` is a non-secret var in the config. Screenshots use the
`BROWSER` binding; no Browser Run API credentials are required.
For local development, use gitignored `workers/updater/.dev.vars.dev`. The existing
shared code reads these values through Workers' populated `process.env`.
Sentry wrappers route shared updater errors to Sentry when `SENTRY_DSN` is set.

```sh
npm test
npm run lint
npm run build
npm run updater:deploy:dry-run
npm run updater:dev
npm run updater:tail
```

Operator requests require `Authorization: Bearer $UPDATER_RUN_TOKEN`, matching
the deployed `RUN_TOKEN` secret. Without `RUN_TOKEN` the endpoints are disabled.

```sh
BASE=https://splatoon2-ink-updater.<subdomain>.workers.dev
curl -X POST -H "Authorization: Bearer $UPDATER_RUN_TOKEN" "$BASE/run"
curl -X POST -H "Authorization: Bearer $UPDATER_RUN_TOKEN" "$BASE/run?only=Schedules,Timeline"
curl -X POST -H "Authorization: Bearer $UPDATER_RUN_TOKEN" "$BASE/arm"
curl -X POST -H "Authorization: Bearer $UPDATER_RUN_TOKEN" "$BASE/pause"
curl -H "Authorization: Bearer $UPDATER_RUN_TOKEN" "$BASE/status"
curl -H "Authorization: Bearer $UPDATER_RUN_TOKEN" "$BASE/list?prefix=data/"
```

`/list` returns at most 1000 public-bucket keys and reports truncation. It is a
small diagnostic endpoint, not a full bucket export tool.

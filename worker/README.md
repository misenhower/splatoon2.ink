# Splatoon 2 app Worker

This Worker is the home for edge behavior on the Splatoon 2 domains. Its first
feature is a read-only directory index for the public R2 bucket. Ordinary object
requests continue to use the R2 custom domain directly and do not invoke the
Worker.

## Directory index

The browser-visible directory URLs end in `/`, for example:

- `https://assets.splatoon2.ink/`
- `https://assets.splatoon2.ink/data/`
- `https://assets.splatoon2.ink/screenshots/`

Each directory also has a non-recursive JSON representation at the same public
URL by adding `?format=json`. Clients must follow the absolute `next` URL when
present because the R2 cursor is opaque.

The production Worker route is intentionally limited to:

```text
assets.splatoon2.ink/__directory/*
```

The internal prefix never appears in links or canonical URLs returned by the
Worker.

## Local development

Run:

```sh
npm run worker:dev
```

Then open `http://localhost:8787/`. The local-development flag lets Wrangler
serve natural directory paths and linked objects from its simulated R2 bucket.
It does not connect to the production bucket.

Validate the Worker without deploying:

```sh
npm run worker:test
npm run worker:deploy:dry-run
```

`npm run worker:deploy` deploys the Worker and must only be run as part of an
intentional production rollout.

## Production rollout

1. Deploy the Worker.
2. Verify a direct internal URL such as
   `https://assets.splatoon2.ink/__directory/data/`.
3. In the `splatoon2.ink` zone, create a Cloudflare **URL Rewrite Rule** with
   this filter expression:

   ```text
   (http.host eq "assets.splatoon2.ink" and ends_with(http.request.uri.path, "/") and not starts_with(http.request.uri.path, "/__directory/"))
   ```

4. Configure a dynamic path rewrite with this expression:

   ```text
   concat("/__directory", http.request.uri.path)
   ```

5. Leave the query string unchanged, deploy the rule, and verify the natural
   root and nested directory URLs in both HTML and JSON formats.

The rewrite runs only for paths ending in `/`; JSON files, calendars, images,
and screenshots remain direct R2 requests. To roll back, disable the URL Rewrite
Rule first, then remove the Worker route or deployment.

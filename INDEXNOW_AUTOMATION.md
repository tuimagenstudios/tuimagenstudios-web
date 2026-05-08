# IndexNow automation

This repository includes a GitHub Actions workflow that notifies IndexNow after a successful GitHub Pages deploy.

## What it does

- Runs after the main deploy workflow finishes successfully.
- Can also be run manually from GitHub Actions with `workflow_dispatch`.
- Reads `sitemap.xml` from the repository root.
- Extracts the public URLs listed in the sitemap.
- Sends those URLs in one JSON POST request to the IndexNow endpoint.

## Workflow

Workflow file:

```text
.github/workflows/indexnow.yml
```

The workflow listens for successful runs of:

```text
Deploy tuimagenstudios.com
```

It does not depend on Node, npm, package installation, or external libraries.

## Required secret

Create this GitHub Actions secret in the repository:

```text
INDEXNOW_KEY
```

The value must be the current IndexNow key. Do not commit the key inside the workflow or documentation.

## Public key file

IndexNow also requires a public verification text file at the site root.

Expected public URL format:

```text
https://tuimagenstudios.com/<INDEXNOW_KEY>.txt
```

The file content must be exactly the same key value, with no extra text.

## Manual test

1. Go to GitHub Actions.
2. Open the `Notify IndexNow` workflow.
3. Click `Run workflow`.
4. Confirm the log shows:
   - URL count detected from `sitemap.xml`.
   - IndexNow endpoint used.
   - HTTP status from IndexNow.
   - A redacted response summary.

The workflow intentionally does not print the key or the full payload.

## Bing Webmaster Tools verification

After the workflow runs:

1. Open Bing Webmaster Tools.
2. Select the `tuimagenstudios.com` property.
3. Review URL submission / IndexNow activity.
4. Confirm that sitemap URLs are being accepted.

IndexNow submission helps discovery and freshness, but it does not guarantee indexing or ranking.

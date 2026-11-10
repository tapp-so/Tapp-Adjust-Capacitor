# Releasing

Releases are published manually from GitHub Actions with the **Publish**
workflow (`.github/workflows/publish.yml`).

## Prerequisites

- `package.json` version must be a prerelease, for example `0.1.0-alpha.0`.
  The workflow refuses to run for any version without a `-`.
- CI (`ci.yml`) must be green on `main`, including the iOS job. The Publish
  workflow only runs lint, typecheck and tests on Linux; it does not build or
  test iOS or Android.
- A repository secret named `NPM_TOKEN` (Settings > Secrets and variables >
  Actions). Use an npm granular access token with read and write (publish)
  permission on this package, created for automation.

## Release

1. Open the Actions tab, choose **Publish**, and click **Run workflow** on
   `main` with **dry_run checked** (the default). Read the file list printed by
   `npm publish --dry-run` and check that only the expected files are included.
2. Run the workflow again with **dry_run unchecked**. This publishes to npm
   under the `alpha` dist-tag with provenance. Both come from `publishConfig`
   in `package.json`, so the workflow passes neither `--tag` nor `--provenance`.

## Notes

- Provenance only works when publishing from GitHub Actions (OIDC). A local
  `npm publish` fails because `publishConfig` sets `provenance: true`.
- `RELEASING.md` is not part of the npm package: the `files` allowlist in
  `package.json` does not include it.

## Optional: switch to trusted publishing

Once the package exists on npm, you can configure trusted publishing for this
repository and the `publish.yml` workflow on npmjs.com (package settings).
After that, delete the `NPM_TOKEN` secret and the `NODE_AUTH_TOKEN` env line
in `publish.yml`.

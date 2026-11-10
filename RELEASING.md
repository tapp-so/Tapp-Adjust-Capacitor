# Releasing

`tapp-adjust-capacitor-sdk` is published manually from GitHub Actions with the
**Publish** workflow (`.github/workflows/publish.yml`).

## Prerequisites

- `package.json` version must be a prerelease whose first prerelease identifier
  equals `publishConfig.tag` (`alpha`), for example `0.1.0-alpha.0`. The
  workflow refuses anything else: `0.1.0` and `0.1.0-beta.0` both fail.
- CI (`ci.yml`) must be green on `main`, including the iOS job. The Publish
  workflow only runs lint, typecheck and tests on Linux; it does not build or
  test iOS or Android.
- The workflow only runs from `main`.

## One-time setup

1. Create a GitHub environment named `npm-publish` (Settings > Environments)
   with Nick as required reviewer. Optionally restrict deployment branches to
   `main`.
2. Add `NPM_TOKEN` as an **environment** secret of `npm-publish`, not as a
   repository secret. Use an npm granular access token with read and write
   permission.
3. A token scoped to this package may not be possible before the package
   exists. For the first publish, use a token scoped to all packages with a
   short expiry, then narrow it to this package (or replace it with trusted
   publishing, below) afterwards.

## Why `publishConfig` has `access: public`

A first-time provenance publish of a new package fails ("Can't generate
provenance for new or private package, you must set access to public") unless
`access` is `public`. `npm publish --dry-run` skips that code path, so a dry
run does not catch the problem.

## Release

1. Open the Actions tab, choose **Publish**, and click **Run workflow** on
   `main` with **dry_run checked** (the default). Approve the `npm-publish`
   environment and read the file list printed by `npm publish --dry-run`;
   check that only the expected files are included. The log may say
   "Publishing ... with tag latest". That is expected: the real publish uses
   the `alpha` tag from `publishConfig`.
2. Run the workflow again with **dry_run unchecked** and approve. This
   publishes to npm under the `alpha` dist-tag with provenance. Tag,
   provenance and access all come from `publishConfig`, so the workflow passes
   no `--tag`, `--provenance` or `--access` flags.
3. Creating a git tag / GitHub release is manual; the workflow does not do it.

## Notes

- Provenance only works when publishing from GitHub Actions (OIDC). A local
  `npm publish` fails because `publishConfig` sets `provenance: true`.
- `RELEASING.md` is not part of the npm package: the `files` allowlist in
  `package.json` does not include it.

## Optional: switch to trusted publishing

Only possible after the first publish.

- Publishing with a dist-tag via OIDC needs npm >= 11.21.0. Node 22 ships npm
  10.9.9 and Node 24 ships 11.19.1, so the workflow already runs
  `npm install -g npm@11.21.0` (use that or newer) and sets
  `package-manager-cache: false`.
- On npmjs.com (package settings), add a trusted publisher for this
  repository with workflow file `publish.yml` and environment `npm-publish`.
- Make the first OIDC publish within the window npm states for the change.
- Then delete the `NPM_TOKEN` environment secret and the `NODE_AUTH_TOKEN`
  line in `publish.yml`.

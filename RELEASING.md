# Releasing

The first version of `tapp-adjust-capacitor-sdk`, `0.1.0-alpha.0`, is published
manually by a maintainer. Every later version is published only from the
**Publish** workflow with npm trusted publishing (OIDC), with no npm token anywhere.
The repository is `tapp-so/Tapp-Adjust-Capacitor`.

## Prerequisites for any release

- The version must be a prerelease whose first identifier equals
  `publishConfig.tag` (`alpha`), for example `0.1.0-alpha.0`.
- CI (`ci.yml`) must be green on `main`, including iOS. The Publish workflow
  runs lint, typecheck and tests on Linux; it has no iOS job.
- The workflow only runs from `main`. Never publish from another branch.
- Create the GitHub environment `npm-publish` with Nick as required reviewer.
  Optionally limit its deployment branches to `main`.
- No `NPM_TOKEN` secret is needed or used. Remove any existing `NPM_TOKEN` secret.

## Step 1: First publish (manual, once)

Use an up-to-date `main` checkout and npm 11.21.0. Log in with 2FA, install
dependencies, check the file list, then publish:

```sh
git switch main && git pull --ff-only
npm install -g npm@11.21.0
npm login
npm ci
npm publish --dry-run --provenance=false
npm publish --provenance=false
npm view tapp-adjust-capacitor-sdk dist-tags
```

The real publish prompts for the 2FA code. `prepack` builds `dist`; the `alpha`
tag and public access come from `publishConfig`. The log may say "tag latest";
check the dist-tags with the final command above.

`publishConfig.provenance` is true, and provenance can only be generated in CI,
so a local publish without `--provenance=false` fails. The CLI flag overrides
`publishConfig` (verified with npm 11.21.0). The environment variable
`NPM_CONFIG_PROVENANCE=false` does not override `publishConfig`, so use the flag.
Alternatively, temporarily editing `publishConfig` works but leaves a local
change; do not commit it. A dry run skips provenance generation, so it cannot
catch the missing flag on a real publish.

This first version has no provenance statement. Later CI versions do.

## Step 2: Link the trusted publisher (npmjs.com)

The package must exist first. Only create the configuration when the next
version is ready to go out from CI: its first successful publish must complete
within 2 days or the configuration expires. If it expires, delete it, create
a new one, and publish within 2 days.

Open the package's **Settings** > **Trusted Publisher**. Under **Select your
publisher**, click **GitHub Actions** and enter:

- **Organization or user:** `tapp-so`
- **Repository:** `Tapp-Adjust-Capacitor`
- **Workflow filename:** `publish.yml` (filename only; it exists in `.github/workflows/`)
- **Environment name:** `npm-publish`
- **Allowed actions:** allow `npm publish`, because this workflow runs
  `npm publish`. `npm stage publish` is always allowed. Leave **Allow npm dist-tag**
  off unless needed.

Fields are case-sensitive and are not verified when saved. New configurations
default to allowing only `npm stage publish`, so explicitly allow `npm publish`.
Trusted publishing needs Node >= 22.14.0 and npm >= 11.5.1; publishing with a
dist-tag over OIDC needs npm >= 11.21.0. The workflow installs npm 11.21.0 and
checks both minimum versions.

## Step 3: First CI release via trusted publishing

1. Bump the version on `main` through a reviewed PR. Keep the `alpha` prerelease
   identifier and wait for all CI checks, including iOS, to pass.
2. In Actions, run **Publish** on `main` with **dry_run checked** (the default).
   Approve the `npm-publish` environment and read the file list.
   A dry run does not validate the trusted publisher.
3. Run **Publish** again with **dry_run unchecked** and approve the environment.
   This first successful CI `npm publish` via trusted publishing must complete
   within the 2-day window after linking the trusted publisher.

## Step 4: Lock down publishing access

After the first trusted-publishing release from the **Publish** workflow has
succeeded, open package **Settings** > **Publishing access**, select
**Require two-factor authentication and disallow tokens**, then click
**Update Package Settings**.
Trusted publishing keeps working through OIDC. Manual publishes still need 2FA;
use them only for the first version as described above.

## Later releases (CI only)

1. Bump the version on `main` through a reviewed PR. Keep the `alpha` prerelease
   identifier and wait for all CI checks, including iOS, to pass.
2. In Actions, run **Publish** on `main` with **dry_run checked** (the default).
   Approve the `npm-publish` environment and read the file list.
3. Run **Publish** again with **dry_run unchecked** and approve the environment.
   The workflow refuses versions already on npm and non-matching prereleases;
   unexpected npm lookup errors also stop the release.
4. Creating a git tag or GitHub release is manual.

Provenance is generated automatically for trusted publishing from GitHub Actions
because this repository and the package are public. `publishConfig.provenance`
stays true; the tag and access also come from `publishConfig`.

## Notes

- `RELEASING.md` is not in the npm package because of the `files` allowlist.
- The case-sensitive GitHub owner/repo in `repository.url` must match
  `tapp-so/Tapp-Adjust-Capacitor`. The `git+https://github.com/<owner>/<repo>.git`
  form used here is fine: `git+https://github.com/tapp-so/Tapp-Adjust-Capacitor.git`.

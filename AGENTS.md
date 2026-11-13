# Tapp Adjust Capacitor SDK

`tapp-adjust-capacitor-sdk` provides Tapp deep linking, attribution, device match, link generation, and events with the native Adjust adapter. It is a superset of `tapp-capacitor-sdk`: every core method and event is unchanged, plus `handleEvent`, `getAdjustAttribution`, and the `adjust*` family.

> **Choose exactly one Tapp package.** Install either `tapp-capacitor-sdk` or `tapp-adjust-capacitor-sdk`, never both. Android fails during configuration with `Install exactly one of tapp-capacitor-sdk or tapp-adjust-capacitor-sdk.` iOS has no compile-time guard: co-installing is unsupported and unsafe because the Adjust adapter overrides the affiliate for the process; core could silently use the Adjust affiliate (last start wins).

To switch, uninstall the current package, install the other, then run `npx cap sync`.
Current published version: `0.1.0-alpha.2`. Alpha; interfaces may change before stable release.

## 1. Integrating this SDK into an app

### Install

```sh
npm i tapp-adjust-capacitor-sdk@alpha @capacitor/app && npx cap sync
```

Pin `@capacitor/app` to the same major as the app's Capacitor version (for Capacitor 8, `@capacitor/app@8`).

### Requirements

| App Capacitor | Node.js | JDK | iOS minimum | Android minSdk |
|---|---|---|---|---|
| 6 | 18+ | 17 | 15.0 | 24 |
| 7 | 20+ | 21 | 15.0 | 24 |
| 8 | 22+ | 21 | 15.0 | 24 |

Peer `@capacitor/core`: `>=6.0.0 <9.0.0`. Capacitor 8 requires Xcode 26+. Standalone plugin builds use Node.js 22+ and JDK 21; Java/Kotlin compilation targets 17.
Raise older apps' deployment targets in the Podfile / Xcode and `android/variables.gradle`. Capacitor 7 with Xcode 27+ needs this Podfile hook; merge into any existing hook and keep `assertDeploymentTarget(installer)`:

```ruby
post_install do |installer|
  assertDeploymentTarget(installer)
  installer.pods_project.targets.each do |target|
    target.build_configurations.each do |config|
      config.build_settings['IPHONEOS_DEPLOYMENT_TARGET'] = '15.0'
    end
  end
end
```

### Differs from the other Tapp wrappers

- `env` is the string `'PRODUCTION'` or `'SANDBOX'`, not an environment enum.
- `shouldProcess({ url })` returns `Promise<{ value: boolean }>`; await and inspect `value`.
- Incoming links come from `@capacitor/app`, with JavaScript passing them to Tapp.
- This is the Adjust superset. Native `shouldProcess` accepts only Adjust links with `adj_t`; do not substitute the core link rule or implement a separate JS rule.
- Unlike React Native Adjust, Android lifecycle forwarding is native; no app lifecycle calls are needed. No public resume/pause methods exist.
- ATT requires the usage string below. Adjust methods have platform restrictions; web is unsupported.
- Android guards against co-installing core and Adjust; iOS does not. SPM and CocoaPods are supported.

### Required native setup

Configure your app identifiers and link domain in the Tapp dashboard. In the examples below, `links.example.com` is illustrative: replace it with your dashboard link host.

### iOS Universal Links

1. In Xcode, open the app target → Signing & Capabilities → Associated Domains, and add `applinks:links.example.com` (host only, no scheme or path). That creates or updates the `.entitlements` file.
2. Confirm `CODE_SIGN_ENTITLEMENTS` on the app target points at that file for every build configuration.
3. Tapp hosts `https://links.example.com/.well-known/apple-app-site-association`. Check the Apple CDN serves the same association; `appID` must be `<TeamID>.<bundleId>`.
4. Test Universal Links on a physical device; simulator results do not establish correct wiring.

### Android App Links

On the launcher activity, configure the same host as iOS:

```xml
<intent-filter android:autoVerify="true">
    <action android:name="android.intent.action.VIEW" />
    <category android:name="android.intent.category.DEFAULT" />
    <category android:name="android.intent.category.BROWSABLE" />
    <data android:scheme="https" android:host="links.example.com" />
</intent-filter>
```

Tapp hosts `https://links.example.com/.well-known/assetlinks.json`. Supply the dashboard with the application ID and **SHA-256 certificate hash** for the distributed build.

### iOS pods (CocoaPods mode only)

Declaring any `source` removes CocoaPods' implicit trunk, so both lines are required, in this order. Recommended now; required from the first wrapper release that pins a native version published after 2 December 2026.

```ruby
source 'https://github.com/tapp-so/Specs.git'   # must be first
source 'https://cdn.cocoapods.org/'
```

SPM product `TappAdjustCapacitorSdk` is the default for new Capacitor 8 apps and recommended. CocoaPods pod: `TappAdjustCapacitorSdk`; set `platform :ios, '15.0'`. Prefer SPM for new integrations and upgrades as CocoaPods trunk becomes read-only on 2 December 2026.

### Android repositories

The Tapp Android SDK is on JitPack. Add `maven { url 'https://jitpack.io' }` to repositories the app actually uses: `allprojects.repositories` or `settings.gradle` → `dependencyResolutionManagement.repositories` (use the equivalent KTS syntax where needed).
The example app's `capacitor:sync:after` hook adds JitPack; it only warns about minSdk below 24.

### App Tracking Transparency (iOS)

When using ATT APIs, including `adjustRequestAppTrackingAuthorization()` and `adjustAppTrackingAuthorizationStatus()`, add this key inside the host app's Info.plist dictionary before calling them. Replace the placeholder with your app's explanation:

```xml
<key>NSUserTrackingUsageDescription</key>
<string>REPLACE_WITH_YOUR_APP_TRACKING_USAGE_DESCRIPTION</string>
```

### Initialize and handle links

`authToken` is the dashboard authentication token; `tappToken` is the dashboard application token. They are distinct values. Inject them at build time (for example `import.meta.env`) from environment-backed configuration; never hard-code, commit, or log them. `env` must match the tokens' `'PRODUCTION'` or `'SANDBOX'` environment. Configure the Adjust app token in the Tapp dashboard; it is not passed from JavaScript.

Set `loggingBehavior: 'none'` in `capacitor.config.ts`. The default `'debug'` logs bridge arguments, including credentials, in debug builds; `'production'` logs them in release too. This setting controls bridge logs, not native SDK logging.

Order: register deferred-link and failure listeners, await `Tapp.start({ authToken, env, tappToken })`, then handle links and call link generation, events, or Adjust APIs. Register `appUrlOpen` before `getLaunchUrl()`. Call this bootstrap once at app startup (for example from `main.ts`). Capacitor retains early native Tapp events until the first listener attaches. Keep a `Set` of already-handled URL strings and skip repeats if Android delivers the same cold-start URL twice.

```ts
import { App } from '@capacitor/app';
import { Tapp } from 'tapp-adjust-capacitor-sdk';
// authToken, env, tappToken come from the app's configuration.

const seen = new Set<string>();
const pending: string[] = [];
let started = false;

async function handleIncomingUrl(url: string): Promise<void> {
  if (seen.has(url)) return;
  seen.add(url);
  try {
    const { value } = await Tapp.shouldProcess({ url });
    if (!value) return;
    const data = await Tapp.fetchLinkData({ url });
    if (data.error) return; // A resolved promise can still represent failure.
    // Route using data.tappUrl, data.influencer, data.data, etc.
  } catch {
    // Handle invalid URL or bridge rejection without logging sensitive data.
  }
}

await Tapp.addListener('deferredLinkReceived', (data) => {
  if (data.error) return;
  // Route using the resolved data without logging credentials or payloads.
});
await Tapp.addListener('didFailResolvingURL', () => {
  // Show a generic link-resolution failure.
});
await App.addListener('appUrlOpen', ({ url }) => {
  if (!started) pending.push(url);
  else void handleIncomingUrl(url);
});
await Tapp.start({ authToken, env, tappToken });
started = true;
for (const url of pending.splice(0)) await handleIncomingUrl(url);
const launch = await App.getLaunchUrl();
if (launch?.url) await handleIncomingUrl(launch.url);
```

Initialize once; later successful native `start()` calls are no-ops. Links stay in JavaScript: no Tapp-specific AppDelegate / Activity link hooks are needed. Android resume/pause forwarding happens natively after startup.
`fetchOriginLinkData()` also requires checking `data.error`. iOS link data omits `deepLink`; Android may include it. Event metadata is flat: only strings, finite numbers, and booleans survive; other values are dropped.

### Adjust platform method matrix

These lists contain every platform-exclusive method. iOS-only methods reject `UNIMPLEMENTED` on Android and web; Android-only methods reject `UNIMPLEMENTED` on iOS and web. The platform check precedes the startup check.

| Method | iOS | Android |
|---|---|---|
| `adjustVerifyAppStorePurchase` | Yes | No |
| `adjustTrackAppStoreSubscription` | Yes | No |
| `adjustConvert` | Yes | No |
| `adjustRequestAppTrackingAuthorization` | Yes | No |
| `adjustAppTrackingAuthorizationStatus` | Yes | No |
| `adjustUpdateSkanConversionValue` | Yes | No |
| `adjustTrackPlayStoreSubscription` | No | Yes |
| `adjustVerifyPlayStorePurchase` | No | Yes |
| `adjustVerifyAndTrackPlayStorePurchase` | No | Yes |
| `adjustGetGoogleAdId` | No | Yes |
| `adjustGetAmazonAdId` | No | Yes |
| `adjustGetGooglePlayInstallReferrer` | No | Yes |
| `adjustSetReferrer` | No | Yes |

Other Adjust methods in `src/definitions.ts` support iOS and Android, including `adjustGetIdfa` (Google advertising ID on Android). Every Adjust method rejects `UNIMPLEMENTED` on web. See README for full signatures and results. ATT status is a promise. Play Store verification uses the purchase token as `transactionId`; subscription `price` is in micro-units, with fractional input truncated.

### Errors → fix

See [`docs/errors.md`](docs/errors.md) for the error catalog.

| Error / result | Fix |
|---|---|
| `INVALID_ARGUMENT` | Check required tokens, environment, method fields and numeric types. |
| `INVALID_URL` | Supply a nonblank valid absolute URL; blocked schemes include `javascript:`, `data:`, `file:`. |
| `NOT_STARTED` | Await successful `start()` before link generation, events or Adjust calls. |
| Link data `{ error: true, message }` | Check startup and resolution; inspect `data.error` even when the promise resolves. |
| `UNIMPLEMENTED` | Gate platform-specific methods; native SDK features are unsupported on web. |
| `START_ERROR`, `URL_ERROR`, `HANDLE_EVENT_ERROR` | Check startup configuration and native SDK / network failure. |
| `SKAN_ERROR`, `INSTALL_REFERRER_ERROR`, `UNAVAILABLE` | Check platform setup and native result availability; consult README. |

`shouldProcess` works before start, but use the documented call order. Link-data methods resolve failures except that `fetchLinkData` rejects invalid URLs before checking startup. Some native callback calls can remain pending; the plugin adds no timeout (see README Known limitations).

### Common mistakes

- Installing both core and Adjust packages; iOS offers no build guard. Confirm core is absent with `npm ls tapp-capacitor-sdk`.
- Missing `@capacitor/app` or registering `appUrlOpen` after reading the launch URL.
- Missing Associated Domains entitlement or `CODE_SIGN_ENTITLEMENTS`; putting a scheme/path in `applinks:`.
- Missing Android `autoVerify`, `BROWSABLE`, host, or the distributed build's SHA-256 certificate hash.
- Missing `NSUserTrackingUsageDescription` when calling ATT APIs.
- Environment/token mismatch, hard-coded tokens, or leaving bridge logging enabled.
- Treating simulator Universal Links as device verification.
- Calling iOS-only methods on Android or Android-only methods on iOS.
- Calling APIs before `start()` completes or ignoring `data.error`.
- Omitting the CocoaPods CDN source or putting it before Specs.

### How to verify

`npx tapp-adjust-capacitor-sdk doctor` is planned for `0.1.0-alpha.3`; it is **not available in `0.1.0-alpha.2`**. Do not run it for this version. The planned doctor is read-only, without installs, syncs, writes or fixes; never pass secrets on a command line.
Until then, manually verify: exactly one Tapp package installed; matching Capacitor and toolchains; deployment minimums; JitPack / SPM or pod sources; entitlement signing and dashboard identifiers; AASA and Apple CDN association; App Links and SHA-256 certificate hash; ATT key when ATT APIs are used; logging disabled; startup/listener order and `data.error` handling. Test cold, warm and deferred links on physical devices. README records pending device tests and unverified iOS builds; do not claim live validation from unit tests.

## 2. Working on this repo

### Layout

- `src/definitions.ts`: public API and types; `src/index.ts`: registration; `src/web.ts`: web fallback; `src/url.ts`: URL validation.
- `ios/Sources/TappAdjustCapacitorPlugin/`: Swift bridge, mapping and privacy manifest; `ios/Tests/`: mapping tests.
- `android/src/main/`: Android bridge and mapping; `android/src/test/`: mapping tests.
- `example-app/`: Vite + TypeScript demo; `src/__tests__/`: TypeScript tests.
- `Package.swift`, `TappAdjustCapacitorSdk.podspec`, `android/build.gradle`: native dependency declarations.

### Safe commands

For code work, use the existing scripts as appropriate (docs-only work needs content and scope checks):

```sh
npm run typecheck
npm run lint
npm test
```

Native verification scripts are `npm run verify:ios` (macOS/Xcode) and `npm run verify:android` (Android toolchain); see README limitations. Do not commit, push, open a PR, publish, run `npm publish` or `pod trunk` without explicit task authorization. Do not edit the native iOS SDK repos (`Tapp-iOS`, `Tapp-Networking-iOS`, `Tapp-Adjust-iOS`).

### Generated files and pins

`dist/` is generated by `npm run build` (clean, TypeScript, Rollup). Example `ios/`, `android/`, `dist/` and dependencies are generated/ignored. Do not hand-edit generated output.
Keep pins in sync: iOS Tapp `1.1.24`, Tapp-Networking `1.1.7`, Tapp-Adjust `1.1.27`, Adjust `5.0.1`; Android `com.github.tapp-so.Tapp-Android:Tapp-Adjust:1.1.6`. SPM also pins Adjust signature SDK `3.47.0`; CocoaPods AdjustSignature resolves transitively within `~> 3.18` and is not pinned here.

### Rules for contributors and agents

- Never read secrets or log credentials, including `authToken`, `tappToken`, purchase/event/push tokens, bridge logs or debug output.
- Use "device match" and "SHA-256 certificate hash" in documentation.
- Do not invent APIs, error codes, versions or available commands; verify README and definitions.
- Docs-only work must preserve runtime behavior, signatures, native code and emitted JavaScript. Respect the task's explicit file scope.

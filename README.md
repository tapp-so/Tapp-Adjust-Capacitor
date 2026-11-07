# Tapp Adjust Capacitor SDK

`tapp-adjust-capacitor-sdk` is a Capacitor plugin for Tapp deep linking and attribution with the Adjust adapter. It exposes one TypeScript API and wraps the native Tapp iOS SDK and Tapp Android SDK together with their Adjust adapters (`Tapp-Adjust`). Use it to start Tapp, generate tracked Tapp links, send events, resolve incoming and deferred (install) links, and call the Adjust APIs from a Capacitor app.

It is a superset of [`tapp-capacitor-sdk`](https://github.com/tapp-so/Tapp-Capacitor): every core method and event is unchanged, and it adds `handleEvent` and the `adjust*` family.

> **Alpha pre-release.** This is `tapp-adjust-capacitor-sdk` `0.1.0-alpha.0`. Interfaces may change before a stable release.

> **Choose exactly one plugin.** Install either `tapp-capacitor-sdk` or `tapp-adjust-capacitor-sdk`, never both.
>
> - **Android:** if both are installed, the Android build fails by design. This plugin's `android/build.gradle` stops the configuration with `Install exactly one of tapp-capacitor-sdk or tapp-adjust-capacitor-sdk.` when the host also includes the `:tapp-capacitor-sdk` project. Both plugins ship a `com.example.tapp.Tapp` class and register the same `Tapp` plugin name. The guard lives only in this plugin, and a CI job (`exclusive-install`) is intended to check it (it has not run yet; see Known limitations).
> - **iOS:** there is **no compile-time guard**. Installing both is unsupported and unsafe: the Adjust adapter overrides the affiliate service for the whole process, so the core plugin could silently run with the Adjust affiliate.
>
> To switch plugins, uninstall one, then install the other and run `npx cap sync`.

## Requirements

| Requirement | Supported |
|---|---|
| Capacitor | 6, 7, 8 (peer `@capacitor/core` `>=6.0.0 <9.0.0`) |
| iOS | 15.0+ |
| Android | minSdk 24+ |

Capacitor 8 defaults already meet these minimums. Apps on older Capacitor versions must raise their minimums:

| App Capacitor version | iOS deployment target | Android `minSdkVersion` |
|---|---|---|
| 8 | Already 15.0+ | Already 24+ |
| 7 | Raise from 14.0 to **15.0** | Raise from 23 to **24** |
| 6 | Raise from 13.0 to **15.0** | Raise from 22 to **24** |

Where to change them:

- **iOS (CocoaPods):** `ios/App/Podfile` — `platform :ios, '15.0'`
- **iOS (Xcode / Swift Package Manager):** select the app target, then Build Settings → iOS Deployment Target → `15.0`
- **Android:** `android/variables.gradle` — `minSdkVersion = 24`

Capacitor 7 apps built with Xcode 27 or later also need a `post_install` hook in `ios/App/Podfile`. Capacitor 7's own pods target iOS 14.0, which Xcode 27 rejects, so the hook sets every pod target to 15.0. If the app already has a `post_install` block, merge the loop into it and keep `assertDeploymentTarget(installer)`:

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

An app whose iOS deployment target (`platform :ios` in the Podfile) is still 14.0 fails at `pod install` by design, because this plugin requires iOS 15.0. Raise it to 15.0 first.

### Toolchain

| App Capacitor version | Node.js (Capacitor CLI) | JDK (Android build) |
|---|---|---|
| 6 | 18 or later | 17 |
| 7 | 20 or later | 21 |
| 8 | 22 or later | 21 |

- The plugin compiles to Java/Kotlin target 17, so it builds in apps that use JDK 17 and in apps that use JDK 21.
- **iOS:** Xcode with the iOS 15 SDK or later. Capacitor 8 needs Xcode 26 or later.
- **Contributors building the plugin standalone** (`android/` with the repo's Capacitor 8 devDependencies) need JDK 21 and Node.js 22 or later.

## Installation

```sh
npm install tapp-adjust-capacitor-sdk
npx cap sync
```

### iOS

The plugin supports both Swift Package Manager (SPM) and CocoaPods:

- SPM product: `TappAdjustCapacitorSdk`
- CocoaPods pod: `TappAdjustCapacitorSdk`

SPM is the default for new Capacitor 8 apps and is the recommended path. The CocoaPods trunk becomes read-only on 2 December 2026, so prefer SPM for new integrations and when you upgrade an existing app.

### Android

The Tapp Android SDK and its Adjust adapter are published through JitPack. Add JitPack to the repositories used by your app. In `android/build.gradle`:

```gradle
allprojects {
    repositories {
        google()
        mavenCentral()
        maven { url 'https://jitpack.io' }
    }
}
```

If your project declares repositories in `android/settings.gradle` through `dependencyResolutionManagement`, add `maven { url 'https://jitpack.io' }` to that `repositories` block instead.

The example app automates this step. Its `capacitor:sync:after` hook runs `scripts/ensure-jitpack.mjs`, which adds JitPack to `allprojects.repositories` after `mavenCentral()` when it is missing. The script does not change `minSdkVersion`; it warns if the value is below 24.

## Native SDK versions

The plugin pins these native SDK versions:

| Platform | Dependency | Version | Pin |
|---|---|---|---|
| iOS | `Tapp` | 1.1.23 | SPM `exact: "1.1.23"`; CocoaPods `= 1.1.23` |
| iOS | `Tapp-Adjust` (SPM product `TappAdjust`) | 1.1.26 | SPM `exact: "1.1.26"`; CocoaPods `= 1.1.26` |
| iOS | `Tapp-Networking` | 1.1.7 | SPM `exact: "1.1.7"`; CocoaPods `= 1.1.7` |
| iOS (transitive, SPM) | Adjust `ios_sdk` | 5.0.1 | Pinned by `Tapp-Adjust-iOS` (`exact: "5.0.1"`); this plugin does not re-pin it |
| iOS (transitive, SPM) | Adjust `adjust_signature_sdk` | not pinned by this plugin | Resolved 3.67.0 in a fresh resolve on 2026-11-06; Android uses `strictly 3.47.0`, so iOS and Android may run different signature SDK versions |
| iOS (transitive, CocoaPods) | `Adjust` pod | not pinned | `Tapp-Adjust.podspec` declares `Adjust` without a version, and this plugin does not add a pin, so CocoaPods resolves it |
| Android | `com.github.tapp-so.Tapp-Android:Tapp-Adjust` | 1.1.6 | Gradle `implementation` |
| Android (transitive) | `com.github.tapp-so.Tapp-Android:Tapp-Core` | 1.1.6 | Pulled in by `Tapp-Adjust` |
| Android (transitive) | `adjust-android` and `adjust-android-webbridge` | 5.0.0 | Pulled in by `Tapp-Adjust` |
| Android (transitive) | `adjust-android-signature` | `strictly 3.47.0` | Pulled in by `Tapp-Adjust` |
| Android (transitive) | `com.android.installreferrer:installreferrer` | 2.2 | Pulled in by `Tapp-Adjust` |

Notes:

- **Signature SDK pin.** `Tapp-Adjust` requires `adjust-android-signature` with `strictly 3.47.0`. If your app (or another library) depends on a different version of that artifact, Gradle dependency resolution can fail or conflict. Align your app with 3.47.0. The plugin does not override it.
- **iOS signature SDK.** This plugin does not pin `adjust_signature_sdk` on iOS. A fresh Swift Package Manager resolve on 2026-11-06 picked 3.67.0, while Android uses `strictly 3.47.0`, so the two platforms may run different signature SDK versions.
- **Android coordinate case.** The core plugin uses `com.github.Tapp-so.Tapp-Android:Tapp-Native`. This plugin uses the lowercase `com.github.tapp-so.Tapp-Android:Tapp-Adjust`, which resolved on JitPack when it was checked.
- **CocoaPods.** The `Adjust` pod version is not pinned by this plugin or by `Tapp-Adjust`. Prefer Swift Package Manager, where the Adjust `ios_sdk` version is pinned.

## Quick start

```ts
import { Tapp, EventAction } from 'tapp-adjust-capacitor-sdk';

// Initialize once at app startup. Later calls are no-ops.
await Tapp.start({
  authToken: AUTH_TOKEN, // load from your configuration, not from source control
  env: 'PRODUCTION',
  tappToken: TAPP_TOKEN,
});

// Listen for deferred links and resolution failures.
// Events emitted before a listener attaches are retained.
await Tapp.addListener('deferredLinkReceived', (data) => {
  console.log('Deferred link:', data);
});
await Tapp.addListener('didFailResolvingURL', ({ url, error }) => {
  console.warn('Could not resolve', url, error);
});

// Generate a tracked link.
const { url } = await Tapp.url({
  influencer: 'creator_name',
  adGroup: 'spring_campaign',
  creative: 'video_a',
  data: { campaign: 'launch' },
});

// Send a standard event with flat metadata.
await Tapp.handleTappEvent({
  eventAction: EventAction.TAPP_PURCHASE,
  metadata: { currency: 'EUR', price: 10.34 },
});

// Send a custom event.
await Tapp.handleTappEvent({
  eventAction: EventAction.CUSTOM,
  customValue: 'onboarding_completed',
});

// Adjust: send an Adjust event by token and read the attribution.
await Tapp.handleEvent({ eventToken: ADJUST_EVENT_TOKEN });
const { attribution } = await Tapp.getAdjustAttribution();
console.log(attribution.network, attribution.campaign);

// The Adjust app token is not passed from JavaScript. It is part of the Tapp configuration.
```

## Handling links

The plugin does not hook the native `AppDelegate` or `Activity`. Your app passes incoming URLs to the SDK from JavaScript, using the `App` plugin from `@capacitor/app` (install it in your app).

- **Cold start:** `App.getLaunchUrl()` returns the URL that launched the app.
- **Warm start:** `App.addListener('appUrlOpen', …)` receives URLs while the app is running.

For each URL, call `shouldProcess` first. If it returns `true`, call `fetchLinkData`. Call `start()` before handling links.

```ts
import { App } from '@capacitor/app';
import { Tapp } from 'tapp-adjust-capacitor-sdk';

async function handleIncomingUrl(url: string): Promise<void> {
  try {
    const { value } = await Tapp.shouldProcess({ url });
    if (!value) return;

    const data = await Tapp.fetchLinkData({ url });
    if (data.error) {
      console.warn('Link resolution failed:', data.message);
      return;
    }
    // Route the user using data.tappUrl, data.influencer, data.data, etc.
    console.log('Link data:', data);
  } catch (error) {
    // Invalid input (for example, an empty URL) rejects with code INVALID_URL.
    console.error('Incoming URL failed:', error);
  }
}

// After Tapp.start(). Register the warm-start listener before reading the launch URL
// so a URL that arrives during the lookup is not missed.
await App.addListener('appUrlOpen', (event) => {
  void handleIncomingUrl(event.url);
});

const launch = await App.getLaunchUrl();
if (launch?.url) {
  await handleIncomingUrl(launch.url);
}
```

A resolved `fetchLinkData` result can still be a failure (`error: true`). Always check `error` before using the payload.

**Differs from the core plugin:** with the Adjust affiliate, `shouldProcess` returns `true` when the URL has an `adj_t` query parameter (the Adjust link token). A URL without `adj_t` returns `false`, so it is not passed to `fetchLinkData`. The core plugin's `shouldProcess` rule does not apply here. The plugin does not call the native `appWillOpen*` methods, and it does not hook `handleOnNewIntent`; links stay JavaScript-side.

## Deferred links and events

The plugin emits two events:

- **`deferredLinkReceived`** — delivers a `TappLinkData` payload when Tapp resolves a deferred (install) link. On iOS, the payload has no `deepLink` field. On Android, it may include `deepLink`.
- **`didFailResolvingURL`** — delivers `{ url: string; error: string }` when Tapp cannot resolve a URL.

Native events are retained until the first listener attaches (Capacitor `retainUntilConsumed`). Attaching listeners after `start()` is therefore safe, and a deferred link received during startup is still delivered.

Remove listeners with the handle returned by `addListener`, or remove all plugin listeners with `Tapp.removeAllListeners()`.

## API reference

All methods are on `Tapp`. Types are exported from `tapp-adjust-capacitor-sdk`. The core methods below behave as in `tapp-capacitor-sdk`; the Adjust methods follow in [Adjust API](#adjust-api).

### `start(options: TappStartOptions): Promise<void>`

Initializes the SDK with the Adjust affiliate (selected natively; there is no affiliate option). `authToken`, `tappToken`, and `env` (`'PRODUCTION'` or `'SANDBOX'`) are required. The first successful call initializes the SDK; later calls resolve without doing anything.

Invalid input rejects with `INVALID_ARGUMENT`. Web and Android also reject whitespace-only tokens; iOS rejects only empty strings. Android may reject with `START_ERROR` if the native SDK fails to initialize. On web, every call validates input and a warning is logged once.

### `url(options: TappUrlOptions): Promise<{ url: string }>`

Generates a Tapp link.

- `influencer` (required, nonempty)
- `adGroup?: string`
- `creative?: string`
- `data?: Record<string, string>` — non-string values are dropped.

Rejects with `NOT_STARTED` before `start()`, with `INVALID_ARGUMENT` for a missing or empty `influencer` (Android also rejects whitespace-only), and with `URL_ERROR` when link generation fails. On web, rejects with `UNIMPLEMENTED`.

### `handleTappEvent(options: TappEventOptions): Promise<void>`

Sends an event.

- `eventAction: EventAction` (required) — `EventAction.CUSTOM` or a standard event from the table below.
- `customValue?: string` — the event name used with `EventAction.CUSTOM`. A missing or blank value falls back to `custom_event_autogenerated`.
- `metadata?: TappMetadata` — flat metadata. Invalid values are dropped (see below).

Rejects with `NOT_STARTED` before `start()`, and with `INVALID_ARGUMENT` unless `eventAction` is an integer from 0 through 40. Android may also reject with `HANDLE_EVENT_ERROR`. On web, rejects with `UNIMPLEMENTED`.

### `shouldProcess(options: { url: string }): Promise<{ value: boolean }>`

**URL rule (`shouldProcess` and `fetchLinkData`).** After trimming, the blank check, scheme-present check, and blocked-scheme check (`javascript:`, `data:`, `file:`, case-insensitive) are the same on web, iOS, and Android. Each platform's URL parser may still differ on edge cases such as `https://x/a b`, `https://`, and `tapp:`. Invalid URLs reject with `INVALID_URL` before the started check, including before `start()`.

Returns whether Tapp should process a URL. It works before `start()`. Invalid URLs reject with `INVALID_URL` (see the URL rule). This method has no `{ error: true }` payload. On iOS, it resolves with the native result. On Android, if the native SDK throws, it resolves `{ value: false }`. On web, a valid URL resolves `{ value: false }`.

### `fetchLinkData(options: { url: string }): Promise<TappLinkData>`

Resolves link data for a URL. An invalid URL (see the URL rule) rejects with `INVALID_URL`, including before `start()`. Otherwise, a call made before `start()` resolves with `{ error: true, message }`. After `start()`, SDK and backend failures also resolve with `{ error: true, message }`, and a successful lookup resolves with the link data and `error: false`. On web, a valid URL resolves with `{ error: true, message: 'Tapp is not supported on web.' }`.

### `fetchOriginLinkData(): Promise<TappLinkData>`

Resolves the original install link data. It takes no URL, so the URL rule does not apply. SDK and backend failures, and calls made before `start()`, resolve with `{ error: true, message }`. On web, it resolves with `{ error: true, message: 'Tapp is not supported on web.' }`.

### `addListener('deferredLinkReceived' | 'didFailResolvingURL', fn)`

Subscribes to the events described in [Deferred links and events](#deferred-links-and-events). Returns a `PluginListenerHandle`.

### `removeAllListeners(): Promise<void>`

Removes all listeners added through this plugin.

### `TappLinkData`

| Field | Type | Notes |
|---|---|---|
| `error` | `boolean` | `true` when resolution failed |
| `message?` | `string` | Failure description, when available |
| `tappUrl?` | `string` | Resolved Tapp URL |
| `attrTappUrl?` | `string` | Attribution Tapp URL |
| `influencer?` | `string` | Influencer associated with the link |
| `data?` | `Record<string, string>` | Custom string data attached to the link |
| `isFirstSession?` | `boolean` | Whether this is the first session |
| `deepLink?` | `string` | Original deep link; omitted on iOS |

Optional fields are omitted when unavailable.

## Adjust API

The methods below are added to `Tapp`. Conventions:

- Every method takes a single options object (or none) and returns a promise that always settles on iOS and Android, except in the native-callback case described under [Known limitations](#known-limitations).
- Before `start()` has completed, **every** method below rejects with `NOT_STARTED` on iOS and Android.
- A method that the current platform does not implement rejects with `UNIMPLEMENTED`. The platform check runs first, so it rejects with `UNIMPLEMENTED` whether or not `start()` was called.
- Missing or blank strings and non-finite numbers reject with `INVALID_ARGUMENT` instead of being skipped silently by the native SDK.
- Optional result fields are omitted when the native SDK returns no value.
- On web, every method below rejects with `UNIMPLEMENTED`.

```ts
import { Tapp } from 'tapp-adjust-capacitor-sdk';

try {
  const { isEnabled } = await Tapp.adjustIsEnabled();
  await Tapp.adjustAddGlobalCallbackParameter({ key: 'user_tier', value: 'gold' });
  const { version } = await Tapp.adjustGetSdkVersion(); // version is omitted when unavailable
} catch (error) {
  // error.code is one of the codes in the Errors table
}
```

### Both platforms

| Method | Result | Notes |
|---|---|---|
| `handleEvent({ eventToken })` | `void` | Sends an Adjust event through Tapp. Android may reject `HANDLE_EVENT_ERROR`. |
| `getAdjustAttribution()` | `{ attribution: AdjustAttribution }` | Fields without a value are omitted. |
| `adjustGetAdid()` | `{ adid?: string }` | |
| `adjustGetIdfa()` | `{ idfa?: string }` | On Android the native SDK reads the Google advertising ID. |
| `adjustTrackAdRevenue({ source, revenue, currency })` | `void` | `source` and `currency` nonblank; `revenue` finite and not negative. |
| `adjustSetPushToken({ token })` | `void` | |
| `adjustGdprForgetMe()` | `void` | |
| `adjustTrackThirdPartySharing({ enabled })` | `void` | `enabled` must be a boolean. |
| `adjustTrackMeasurementConsent({ consent })` | `void` | `consent` must be a boolean. |
| `adjustEnable()`, `adjustDisable()` | `void` | |
| `adjustIsEnabled()` | `{ isEnabled: boolean }` | |
| `adjustSwitchToOfflineMode()`, `adjustSwitchBackToOnlineMode()` | `void` | |
| `adjustAddGlobalCallbackParameter({ key, value })`, `adjustAddGlobalPartnerParameter({ key, value })` | `void` | See the [argument-order note](#global-parameter-argument-order). |
| `adjustRemoveGlobalCallbackParameter({ key })`, `adjustRemoveGlobalPartnerParameter({ key })` | `void` | |
| `adjustRemoveGlobalCallbackParameters()`, `adjustRemoveGlobalPartnerParameters()` | `void` | |
| `adjustGetSdkVersion()` | `{ version?: string }` | |

### iOS only (Android and web reject `UNIMPLEMENTED`)

| Method | Result | Notes |
|---|---|---|
| `adjustVerifyAppStorePurchase({ transactionId, productId })` | `VerifyResult` | Rejects `UNAVAILABLE` if the native SDK returns no result. |
| `adjustTrackAppStoreSubscription({ price, currency, transactionId })` | `void` | Only these three fields are accepted. |
| `adjustConvert({ universalLink, scheme })` | `{ url?: string }` | `url` is omitted when the link cannot be converted. An unparsable `universalLink` rejects `INVALID_URL`. |
| `adjustRequestAppTrackingAuthorization()` | `{ status?: number }` | See [App Tracking Transparency](#app-tracking-transparency-att). |
| `adjustAppTrackingAuthorizationStatus()` | `{ status: number }` | A promise, not a synchronous value. |
| `adjustUpdateSkanConversionValue({ value, coarseValue?, lockWindow? })` | `void` | `value` must be an integer. A native error rejects `SKAN_ERROR`. `lockWindow` is typed as a number; the iOS bridge also accepts a boolean. |

### Android only (iOS and web reject `UNIMPLEMENTED`)

| Method | Result | Notes |
|---|---|---|
| `adjustTrackPlayStoreSubscription({ price, currency, sku, orderId, signature, purchaseToken, purchaseTime? })` | `void` | `price` and `purchaseTime` are finite numbers converted to native `Long`. Pass `price` in micro-units (for example 9.99 → 9990000, typically Google Play Billing's `priceAmountMicros`); fractional input is truncated toward zero, not rounded or converted. |
| `adjustVerifyPlayStorePurchase({ transactionId, productId })` | `VerifyResult` | `transactionId` is the Play purchase token; see the [mapping note](#play-store-verify-mapping). |
| `adjustVerifyAndTrackPlayStorePurchase({ eventToken })` | `VerifyResult` | |
| `adjustGetGoogleAdId()` | `{ googleAdId?: string }` | |
| `adjustGetAmazonAdId()` | `{ amazonAdId?: string }` | |
| `adjustGetGooglePlayInstallReferrer()` | `AdjustInstallReferrer` | Rejects `INSTALL_REFERRER_ERROR` when the native read fails. |
| `adjustSetReferrer({ referrer })` | `void` | |

### Result types

`AdjustAttribution` (every field is optional and omitted when null or absent):

| Field | Type | Notes |
|---|---|---|
| `trackerToken`, `trackerName`, `network`, `campaign`, `adgroup`, `creative`, `clickLabel` | `string` | `adgroup` is the key on both platforms |
| `costType`, `costCurrency` | `string` | |
| `costAmount` | `number` | |
| `fbInstallReferrer` | `string` | Android only |

The attribution has no `adid`, cost in USD, or callback and partner parameter fields, because neither native attribution type provides them. Use `adjustGetAdid()` for the ID.

`AdjustInstallReferrer` (typed subset, every field optional):

| Field | Type | Notes |
|---|---|---|
| `installReferrer` | `string` | Omitted when null or blank |
| `referrerClickTimestampSeconds` | `number` | Omitted when 0 or less (0 is the Play default for "unavailable") |
| `installBeginTimestampSeconds` | `number` | Omitted when 0 or less |

`VerifyResult` is `{ verificationStatus: string; code: number; message: string }`.

### Global parameter argument order

The two native SDKs take different argument orders: iOS `adjustAddGlobalCallbackParameter(value, key:)` (value first) and Android `(key, value)`. The plugin maps the JavaScript `{ key, value }` to the right native order on both platforms (unit-tested), so pass `key` and `value` by name and ignore the native order.

### Play Store verify mapping

For `adjustVerifyPlayStorePurchase`, JavaScript `transactionId` is the **Google Play purchase token**. The plugin builds the native purchase object as `(productId, purchaseToken = transactionId)`. The React Native wrapper passed these two values swapped; this plugin does not.

### Adjust API matrix

Core methods (`start`, `url`, `handleTappEvent`, `shouldProcess`, `fetchLinkData`, `fetchOriginLinkData`, the two listeners, `removeAllListeners`) are supported on both platforms. Every method below works on web only as a rejection with `UNIMPLEMENTED`. "No" means the call rejects with `UNIMPLEMENTED` on that platform.

| Method | iOS | Android | Notes |
|---|---|---|---|
| `handleEvent` | Yes | Yes | |
| `getAdjustAttribution` | Yes | Yes | `fbInstallReferrer` is Android only |
| `adjustGetAdid` | Yes | Yes | |
| `adjustGetIdfa` | Yes | Yes | Android reads the Google advertising ID |
| `adjustTrackAdRevenue` | Yes | Yes | Invalid values reject `INVALID_ARGUMENT` |
| `adjustSetPushToken` | Yes | Yes | |
| `adjustGdprForgetMe` | Yes | Yes | |
| `adjustTrackThirdPartySharing` | Yes | Yes | No callback parameter |
| `adjustTrackMeasurementConsent` | Yes | Yes | |
| `adjustEnable` / `adjustDisable` | Yes | Yes | |
| `adjustIsEnabled` | Yes | Yes | |
| `adjustSwitchToOfflineMode` / `adjustSwitchBackToOnlineMode` | Yes | Yes | |
| `adjustAddGlobalCallbackParameter` | Yes | Yes | Key and value, mapped per platform |
| `adjustAddGlobalPartnerParameter` | Yes | Yes | Key and value, mapped per platform |
| `adjustRemoveGlobalCallbackParameter` | Yes | Yes | |
| `adjustRemoveGlobalPartnerParameter` | Yes | Yes | |
| `adjustRemoveGlobalCallbackParameters` | Yes | Yes | |
| `adjustRemoveGlobalPartnerParameters` | Yes | Yes | |
| `adjustGetSdkVersion` | Yes | Yes | |
| `adjustVerifyAppStorePurchase` | Yes | No | Android rejects `UNIMPLEMENTED` |
| `adjustTrackAppStoreSubscription` | Yes | No | Price, currency and transaction ID only |
| `adjustConvert` | Yes | No | |
| `adjustRequestAppTrackingAuthorization` | Yes | No | Needs `NSUserTrackingUsageDescription` |
| `adjustAppTrackingAuthorizationStatus` | Yes | No | Promise |
| `adjustUpdateSkanConversionValue` | Yes | No | |
| `adjustTrackPlayStoreSubscription` | No | Yes | `price` in micro-units; fractional input is truncated |
| `adjustVerifyPlayStorePurchase` | No | Yes | `transactionId` is the purchase token |
| `adjustVerifyAndTrackPlayStorePurchase` | No | Yes | |
| `adjustGetGoogleAdId` | No | Yes | |
| `adjustGetAmazonAdId` | No | Yes | iOS rejects instead of never settling |
| `adjustGetGooglePlayInstallReferrer` | No | Yes | Typed subset, not the raw native object |
| `adjustSetReferrer` | No | Yes | |

There are no public `adjustOnResume` or `adjustOnPause` methods: the Android plugin forwards them natively (see [Android lifecycle](#android-lifecycle)).

### Errors

Errors reject with a `code`. Only codes that the code base uses are listed.

| Code | Raised by | Meaning |
|---|---|---|
| `INVALID_ARGUMENT` | `start`, `url`, `handleTappEvent`, `handleEvent`, and every `adjust*` method that takes input | Missing or invalid credentials, `env`, `influencer`, `eventAction`, or Adjust input (missing or blank string, non-finite number, wrong type, negative ad revenue, non-integer SKAN `value`) |
| `INVALID_URL` | `shouldProcess`, `fetchLinkData`; `adjustConvert` (iOS) | URL fails the URL rule (missing, blank, not absolute, or `javascript:`, `data:`, or `file:`), or `universalLink` cannot be parsed. Checked before `start()`; for `adjustConvert`, after the platform and `NOT_STARTED` checks. |
| `URL_ERROR` | `url` | Link generation failed |
| `NOT_STARTED` | `url`, `handleTappEvent`, `handleEvent`, and every `adjust*` method (iOS and Android) | `start()` has not completed |
| `START_ERROR` | `start` (Android) | The native SDK failed to initialize |
| `HANDLE_EVENT_ERROR` | `handleTappEvent`, `handleEvent` (Android) | The native SDK failed while sending the event |
| `SKAN_ERROR` | `adjustUpdateSkanConversionValue` (iOS) | The native SDK reported an error |
| `INSTALL_REFERRER_ERROR` | `adjustGetGooglePlayInstallReferrer` (Android) | The native install referrer read failed (generic message) |
| `UNAVAILABLE` | `adjustVerifyAppStorePurchase` (iOS), `adjustVerifyPlayStorePurchase`, `adjustVerifyAndTrackPlayStorePurchase` (Android); other Android `adjust*` calls | The native SDK returned no verification result (or a result without a required field), or an Android Adjust call threw synchronously (generic message, so no native text is echoed) |
| `UNIMPLEMENTED` | iOS-only methods on Android, Android-only methods on iOS; `url`, `handleTappEvent`, `handleEvent` and every `adjust*` method on web | Not available on this platform |

On iOS and Android, `fetchLinkData` and `fetchOriginLinkData` called before `start()` resolve with `{ error: true, message }` instead of rejecting. `shouldProcess` works before `start()`. Call `start()` first. On web, errors carry the same codes where they apply.

### Metadata rules

`TappMetadata` is a flat object: each value must be a string, a finite number, or a boolean. Other values (nested objects, arrays, `null`, `NaN`, `Infinity`) are dropped silently. The call does not throw.

### `EventAction`

Values match the native SDKs.

| Value | Name |
|---|---|
| 0 | `CUSTOM` (use with `customValue`) |
| 1 | `TAPP_ADD_PAYMENT_INFO` |
| 2 | `TAPP_ADD_TO_CART` |
| 3 | `TAPP_ADD_TO_WISHLIST` |
| 4 | `TAPP_COMPLETE_REGISTRATION` |
| 5 | `TAPP_CONTACT` |
| 6 | `TAPP_CUSTOMIZE_PRODUCT` |
| 7 | `TAPP_DONATE` |
| 8 | `TAPP_FIND_LOCATION` |
| 9 | `TAPP_INITIATE_CHECKOUT` |
| 10 | `TAPP_GENERATE_LEAD` |
| 11 | `TAPP_PURCHASE` |
| 12 | `TAPP_SCHEDULE` |
| 13 | `TAPP_SEARCH` |
| 14 | `TAPP_START_TRIAL` |
| 15 | `TAPP_SUBMIT_APPLICATION` |
| 16 | `TAPP_SUBSCRIBE` |
| 17 | `TAPP_VIEW_CONTENT` |
| 18 | `TAPP_CLICK_BUTTON` |
| 19 | `TAPP_DOWNLOAD_FILE` |
| 20 | `TAPP_JOIN_GROUP` |
| 21 | `TAPP_ACHIEVE_LEVEL` |
| 22 | `TAPP_CREATE_GROUP` |
| 23 | `TAPP_CREATE_ROLE` |
| 24 | `TAPP_LINK_CLICK` |
| 25 | `TAPP_LINK_IMPRESSION` |
| 26 | `TAPP_APPLY_FOR_LOAN` |
| 27 | `TAPP_LOAN_APPROVAL` |
| 28 | `TAPP_LOAN_DISBURSAL` |
| 29 | `TAPP_LOGIN` |
| 30 | `TAPP_RATE` |
| 31 | `TAPP_SPEND_CREDITS` |
| 32 | `TAPP_UNLOCK_ACHIEVEMENT` |
| 33 | `TAPP_ADD_SHIPPING_INFO` |
| 34 | `TAPP_EARN_VIRTUAL_CURRENCY` |
| 35 | `TAPP_START_LEVEL` |
| 36 | `TAPP_COMPLETE_LEVEL` |
| 37 | `TAPP_POST_SCORE` |
| 38 | `TAPP_SELECT_CONTENT` |
| 39 | `TAPP_BEGIN_TUTORIAL` |
| 40 | `TAPP_COMPLETE_TUTORIAL` |

### Android lifecycle

The Adjust SDK needs resume and pause signals for accurate session tracking. The Android plugin forwards them natively, so the app does not call anything:

- `handleOnResume` and `handleOnPause` forward `adjustOnResume()` and `adjustOnPause()` to the native SDK **only after `start()` has completed successfully**. Nothing is forwarded before that.
- **First resume.** If `start()` finishes after the Activity's first `onResume`, that first resume would be missed. To cover it, after the first successful `start()` the plugin checks on the main thread whether the host Activity is already in the resumed state (using the AndroidX `Lifecycle` API of the Activity) and, if so and no resume was forwarded yet, calls `adjustOnResume()` once. If the Activity is not a lifecycle owner or is not resumed, nothing is called and the next `handleOnResume` forwards.
- Forwarding failures never fail `start()` or the lifecycle callbacks.
- `handleOnNewIntent` is **not** hooked. Links are handled in JavaScript.
- There are no public `adjustOnResume` or `adjustOnPause` methods.

These behaviors are covered by unit tests of the decision logic only. They have not been verified on a device or against a live Adjust SDK.

### App Tracking Transparency (ATT)

`adjustRequestAppTrackingAuthorization()` and `adjustAppTrackingAuthorizationStatus()` are iOS only. Add `NSUserTrackingUsageDescription` to the host app's `Info.plist` with text that explains your real use:

```xml
<key>NSUserTrackingUsageDescription</key>
<string>This identifier is used to measure and attribute app installs.</string>
```

`adjustAppTrackingAuthorizationStatus()` returns a promise (not a synchronous number). The `status` values come from the native SDK and are passed through as numbers. The prompt flow has not been verified on a device.

### Platform differences

- **iOS:** link data has no `deepLink` field.
- **iOS and Android:** calls made before `start()` are guarded. `url` and `handleTappEvent` reject with `NOT_STARTED`. `fetchLinkData` and `fetchOriginLinkData` resolve `{ error: true, message }` (`fetchLinkData` still rejects an invalid URL with `INVALID_URL` first). `shouldProcess` works before `start()`.
- **Android:** `fetchOriginLinkData` calls the native `fetchOriginalLinkData`.
- **Adjust methods:** work on iOS and Android as listed in the [Adjust API matrix](#adjust-api-matrix). A method the platform does not implement rejects with `UNIMPLEMENTED` (the platform check runs before the `NOT_STARTED` check). All Adjust methods reject with `NOT_STARTED` before `start()`.
- **Attribution:** `fbInstallReferrer` exists only on Android.
- **Android:** Adjust lifecycle forwarding is native (see [Android lifecycle](#android-lifecycle)). iOS needs no equivalent.
- **Link handling:** with the Adjust affiliate, `shouldProcess` is `true` for URLs that have an `adj_t` parameter.
- **Web:** not supported. `start` validates its input and logs a warning once. `url`, `handleTappEvent`, `handleEvent`, and every `adjust*` method reject with `UNIMPLEMENTED`. `shouldProcess` and `fetchLinkData` apply the URL rule and reject with `INVALID_URL`; otherwise `shouldProcess` resolves `{ value: false }`, and `fetchLinkData` resolves with `{ error: true, message: 'Tapp is not supported on web.' }`. `fetchOriginLinkData` resolves with the same unsupported-platform payload.

## Universal Links and App Links

Tapp manages the association files for your link domain after you configure your app in the Tapp dashboard. You do not host them yourself. Configure the dashboard with your app identifiers, then complete the native setup below. Use your own Tapp link domain in place of the placeholders.

### iOS (Universal Links)

In Xcode, open the app target, go to **Signing & Capabilities**, add **Associated Domains**, and add:

```text
applinks:YOUR_TAPP_LINK_DOMAIN
```

Make sure the bundle identifier and Apple team ID in the dashboard match your Xcode project. Test Universal Links on a physical device.

### Android (App Links)

Add an intent filter with `android:autoVerify="true"` to `MainActivity` in `android/app/src/main/AndroidManifest.xml`:

```xml
<intent-filter android:autoVerify="true">
    <action android:name="android.intent.action.VIEW" />
    <category android:name="android.intent.category.DEFAULT" />
    <category android:name="android.intent.category.BROWSABLE" />
    <data android:scheme="https" android:host="YOUR_TAPP_LINK_DOMAIN" />
</intent-filter>
```

In the Tapp dashboard, provide your application ID and the **SHA-256 signing certificate hash** of the build you distribute, so Tapp can host `assetlinks.json` for your domain.

## Privacy and data disclosure

This section describes what the bundled native SDKs do. It is provided for app developers and is not legal advice.

To attribute installs, the native Tapp SDK sends device and app information to Tapp's servers, including a device match request on first launch.

- **iOS:** the data includes values such as screen resolution, device model, language, region, locale, calendar, time zone, platform, bundle identifier, a Tapp device identifier, and data collected by a hidden web view.
- **Android:** the Tapp SDK uses the Google Play Install Referrer and may read the advertising ID (GAID) and Android ID. Its manifest merges the `INTERNET`, `com.google.android.gms.permission.AD_ID`, and install-referrer permissions.

App developers are responsible for declaring this data collection in App Store privacy details and in Google Play Data safety, and for obtaining any consent that applies to your app.

The plugin ships a `PrivacyInfo.xcprivacy` manifest that declares the data the bundled Tapp SDK sends:

- **Device ID** — Tapp-issued device identifier (analytics, app functionality).
- **Product Interaction** — in-app events (analytics).
- **Other Data Types** — device and app attributes used for the device match request (analytics, app functionality).

None of these is declared as linked to the user or used for tracking. Apps must still reflect the collected data in their App Store privacy details and Google Play Data safety.

**The Adjust SDK collects its own data on top of this.** This plugin includes the Adjust SDK through the Tapp Adjust adapters, and the Adjust SDK sends its own data to Adjust. This README does not list it; consult Adjust's documentation. The same applies to the Adjust-related APIs the plugin exposes (advertising identifiers, App Tracking Transparency, SKAdNetwork, third-party sharing, and global partner parameters). The host app owns the App Store privacy details (including the App Tracking Transparency and `NSUserTrackingUsageDescription` decisions) and the Google Play Data safety form.

- **Baseline manifest.** The plugin's `PrivacyInfo.xcprivacy` is the same baseline as the core plugin's (above). It was not widened for Adjust. Whether the Adjust APIs require `NSPrivacyTracking` or tracking-domain entries is an **open question** (see the changelog); do not read the baseline as an answer.
- **Android manifest.** Manifest entries contributed by the Adjust AARs (permissions and other merged entries) have **not been inspected**. Check your merged manifest.

### Logging

Capacitor's `loggingBehavior` `'none'` never logs. `'debug'` (the default) logs in debug builds only, including every plugin call's arguments, so `authToken` and `tappToken` appear in plain text in logcat (Android) and the Xcode console (iOS). `'production'` logs in every build including release, so never use it in an app that passes credentials. Set `loggingBehavior` to `'none'` in `capacitor.config.ts` (the example app does). This setting only controls Capacitor bridge logging, not the native Tapp SDK's own logs:

```ts
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.example.app',
  appName: 'My App',
  webDir: 'dist',
  loggingBehavior: 'none',
};

export default config;
```

The plugin's own native logs never print tokens.

## Example app

[`example-app/`](./example-app) is a Vite and TypeScript app that exercises the API. It shows `start()`, listeners, link generation, events, cold- and warm-start link handling, and the Adjust calls (including the iOS-only and Android-only blocks, where a method the platform does not implement shows "unsupported on this platform"). See [`example-app/README.md`](./example-app/README.md) for setup.

## Known limitations

- **Alpha.** Interfaces may change before a stable release.
- **Link handling is JavaScript-side only.** The plugin does not intercept links natively and does not hook `handleOnNewIntent`; apps pass URLs to `shouldProcess` and `fetchLinkData` themselves. Whether Adjust attribution of opened links on Android needs a native hook is untested.
- **The web platform is not supported.** Every Adjust method rejects with `UNIMPLEMENTED` there.
- **Device tests are pending.** No end-to-end test has run on a physical device or with real tokens: deferred links, Universal Links and App Links, cold and warm start, Adjust session tracking, the Android first-resume forwarding, ATT, SKAN, and purchase verification are all unverified.
- **The iOS side has not been compiled.** The iOS plugin was developed on a Linux machine without the iOS SDK. The Swift files only passed a syntax parse, and the mapping unit tests ran on Linux. The Xcode build, including whether importing `Tapp`, `TappNetworking`, and `TappAdjust` together compiles without ambiguity, and the `xcodebuild` CI job are unverified. Whether the Adjust affiliate is active after `start()` on iOS (for example, `adjustGetSdkVersion` returning a value) is also unverified.
- **Android native callbacks may never fire.** In Android `Tapp-Adjust`, `runAdjustCall` swallows local exceptions and the callback is skipped, and the adapter also returns without a callback when no Adjust service is resolved. The related promise (for example `getAdjustAttribution`) can then stay pending. This is native Tapp-Adjust behavior. The plugin's `NOT_STARTED` guard and input validation avoid the known paths, and it adds no timeout. Independently of the adapters, the Adjust SDK itself might not invoke a callback in some conditions on either platform; this has not been observed or tested.
- **Android Adjust manifest entries are not inspected** (see Privacy), and the Adjust tracking question for the privacy manifest is open.
- **iOS has no co-install guard** (see "Choose exactly one plugin"). On 2026-11-07 the Android guard was run from the repo root with `CORE_DIR=/workspace/tapp/Tapp-Capacitor JAVA_HOME=<JDK 21> bash .github/ci/build-exclusive-install-host.sh` against tapp-capacitor-sdk at commit b439231 (local checkout): it built a Capacitor 8 host with both plugins, the Android build failed with "Install exactly one of tapp-capacitor-sdk or tapp-adjust-capacitor-sdk.", and the script reported PASS. The `exclusive-install` GitHub Actions job has not run yet. The iOS side was not tested.
- **CocoaPods:** the Adjust pod version is not pinned (see Native SDK versions). A CocoaPods build of this plugin has not been run.
- **No minified release test.** The Adjust adapter ships no Proguard rules and this plugin adds none for it. A minified release build with Adjust has not been tested.

## License

MIT. See [LICENSE](./LICENSE).

## Support

Contact [support@tapp.so](mailto:support@tapp.so).

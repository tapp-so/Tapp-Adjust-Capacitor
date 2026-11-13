# Error catalog

`tapp-adjust-capacitor-sdk` · `0.1.0-alpha.2` · Capacitor · Adjust adapter.

This is the human-readable companion to [errors.json](errors.json), using the `tapp-errors/1` schema. Source links refer to this repository revision. Exact messages preserve source punctuation and casing; patterns show substitutions or native values. Each row records a message-producing source site; shared helpers list every affected method. Mapping gate rows point to the message producer and identify the bridge dispatcher in their notes.

## Handling failures

Core methods retain the core Tapp wrapper behavior. Native `url` and `handleTappEvent` check startup before input. Native successful `start()` calls after the first are no-ops, including input validation; web validates every call without starting a native SDK. iOS start tokens are checked for empty strings only, so whitespace-only tokens pass. Android and web reject whitespace-only tokens. iOS `url` also accepts whitespace-only `influencer`; Android rejects it. Supply nonblank strings on every platform.

For `fetchLinkData({ url })`:

1. Invalid URL on any platform → reject `INVALID_URL`, even before startup.
2. Valid URL on web → resolve `{ error: true, message: 'Tapp is not supported on web.' }`.
3. Valid URL before native startup → resolve `{ error: true, message: 'Tapp has not been started. Call start() first.' }`, without a code.
4. After native startup → successful data resolves with `error: false`; native/backend failures resolve with `error: true` and a message, without a code. Android also resolves an error for a null response or a caught non-cancellation exception.

`fetchOriginLinkData()` starts at step 2: it takes no URL. Always inspect `data.error` before routing, as well as catching promise rejections. `shouldProcess` has no startup requirement and no error payload: invalid URLs reject; valid web URLs and caught Android native exceptions resolve `{ value: false }`. On native platforms, use its Adjust link rule (`adj_t`) rather than implementing a separate JavaScript rule.

URL validation trims surrounding whitespace, requires a parseable URL with a scheme, and blocks `javascript:`, `data:` and `file:` case-insensitively. Platform parsers can differ on edge cases; see [URL API notes](../src/definitions.ts#L400). iOS `adjustConvert` uses the same parser for `universalLink`, after platform and startup checks.

Adjust calls check platform support first, then startup, then input, then invoke native code. Thus an unsupported platform rejects `UNIMPLEMENTED` even before startup; a supported method rejects `NOT_STARTED` before validating input. Every Adjust API, including `handleEvent` and `getAdjustAttribution`, rejects `UNIMPLEMENTED` on web. Web throws inside async methods reject the returned promise.

Adjust string readers require actual nonblank strings. Numeric readers require finite numbers, rejecting numeric strings and booleans; ad revenue also rejects negatives. iOS SKAN `value` must be an integer representable by native `Int`; the bridge adds no SKAN range validation. Its message says `lockWindow` must be a number, while its mapping also accepts a boolean. Optional SKAN null fields count as absent. Android subscription `price` is in micro-units; fractional `price` and `purchaseTime` are truncated toward zero, not rejected. Null `purchaseTime` counts as absent.

## Codes and fixes

| Code | Action |
| --- | --- |
| `INVALID_ARGUMENT` | Correct required fields and types; see exact platform messages below. |
| `INVALID_URL` | Supply a nonblank parseable absolute URL with an allowed scheme. |
| `URL_ERROR` | Check link-generation input, configuration and network availability. |
| `NOT_STARTED` | Await successful `Tapp.start()` before dependent calls. |
| `START_ERROR` | Check Android native startup configuration and the token environment. |
| `HANDLE_EVENT_ERROR` | Check startup and the appropriate Tapp event input or Adjust event token. |
| `SKAN_ERROR` | Check iOS SKAdNetwork setup and native conversion-value requirements. |
| `INSTALL_REFERRER_ERROR` | Check Google Play installation and install-referrer service availability. |
| `UNAVAILABLE` | Check purchase/native Adjust setup and handle absent results or synchronous failures. |
| `UNIMPLEMENTED` | Gate calls by platform using the supported method matrix in [README](../README.md#adjust-api-matrix). |
| No code; resolved `error: true` | Inspect `data.error`; check startup, link configuration and network availability. |

`ADJUST_FAILED` is a Kotlin constant containing `The Adjust SDK call failed.`; its rejection code is `UNAVAILABLE`. Purchase verification results have their own numeric `code` field, which is not a bridge rejection code. A returned verification failure result still resolves.

## Source-site catalog

Each site below has a unique anchor matching its JSON `id`. “Before startup” also describes defensive missing-instance startup guards. “Either” means the site is not limited to successful native startup. Fixes describe checks and error handling, not guaranteed delivery or recovery.

<a id="ios-start-input"></a>

### ios-start-input

| Code | Platform | Methods | Behavior | Startup state |
| --- | --- | --- | --- | --- |
| `INVALID_ARGUMENT` | ios | `start` | `reject` | `before-start` |

Message (exact): `authToken and tappToken must be nonempty strings; env must be PRODUCTION or SANDBOX.`

Cause: A token is missing, empty or not a string, or env is invalid.

Fix: Load the correct dashboard tokens from app configuration and pass env exactly PRODUCTION or SANDBOX. Use tokens containing non-whitespace characters; never log their values.

Source: [ios/Sources/TappAdjustCapacitorPlugin/TappAdjustPlugin.swift:35](../ios/Sources/TappAdjustCapacitorPlugin/TappAdjustPlugin.swift#L35).

Notes: iOS uses isEmpty, so whitespace-only tokens pass this check. After successful native start, later calls resolve before validation.

<a id="android-start-input"></a>

### android-start-input

| Code | Platform | Methods | Behavior | Startup state |
| --- | --- | --- | --- | --- |
| `INVALID_ARGUMENT` | android | `start` | `reject` | `before-start` |

Message (exact): `Nonempty authToken and tappToken and env PRODUCTION or SANDBOX are required.`

Cause: A token is missing, blank or not a string, or env is invalid.

Fix: Load the correct dashboard tokens from app configuration and pass env exactly PRODUCTION or SANDBOX. Use tokens containing non-whitespace characters; never log their values.

Source: [android/src/main/java/so/tapp/capacitor/adjust/TappAdjustPlugin.kt:66](../android/src/main/java/so/tapp/capacitor/adjust/TappAdjustPlugin.kt#L66).

Notes: Android rejects whitespace-only tokens. After successful native start, later calls resolve before validation.

<a id="web-start-input"></a>

### web-start-input

| Code | Platform | Methods | Behavior | Startup state |
| --- | --- | --- | --- | --- |
| `INVALID_ARGUMENT` | web | `start` | `reject` | `either` |

Message (exact): `authToken, tappToken, and a PRODUCTION or SANDBOX env are required.`

Cause: A token is missing, blank or not a string, or env is invalid.

Fix: Load the correct dashboard tokens from app configuration and pass env exactly PRODUCTION or SANDBOX. Use tokens containing non-whitespace characters; never log their values.

Source: [src/web.ts:50](../src/web.ts#L50).

Notes: Web validates every start call, rejects whitespace-only tokens and does not initialize a native SDK.

<a id="android-start-native"></a>

### android-start-native

| Code | Platform | Methods | Behavior | Startup state |
| --- | --- | --- | --- | --- |
| `START_ERROR` | android | `start` | `reject` | `before-start` |

Message (exact): `Unable to start Tapp.`

Cause: Native instance setup or startup throws.

Fix: Check the app configuration, token environment and native integration, then retry startup without logging credentials.

Source: [android/src/main/java/so/tapp/capacitor/adjust/TappAdjustPlugin.kt:78](../android/src/main/java/so/tapp/capacitor/adjust/TappAdjustPlugin.kt#L78).

<a id="ios-url-not-started"></a>

### ios-url-not-started

| Code | Platform | Methods | Behavior | Startup state |
| --- | --- | --- | --- | --- |
| `NOT_STARTED` | ios | `url` | `reject` | `before-start` |

Message (exact): `Tapp has not been started. Call start() first.`

Cause: Successful startup has not completed.

Fix: Await successful Tapp.start() before calling this method.

Source: [ios/Sources/TappAdjustCapacitorPlugin/TappAdjustPlugin.swift:52](../ios/Sources/TappAdjustCapacitorPlugin/TappAdjustPlugin.swift#L52).

<a id="ios-handleTappEvent-not-started"></a>

### ios-handleTappEvent-not-started

| Code | Platform | Methods | Behavior | Startup state |
| --- | --- | --- | --- | --- |
| `NOT_STARTED` | ios | `handleTappEvent` | `reject` | `before-start` |

Message (exact): `Tapp has not been started. Call start() first.`

Cause: Successful startup has not completed.

Fix: Await successful Tapp.start() before calling this method.

Source: [ios/Sources/TappAdjustCapacitorPlugin/TappAdjustPlugin.swift:79](../ios/Sources/TappAdjustCapacitorPlugin/TappAdjustPlugin.swift#L79).

<a id="android-core-not-started"></a>

### android-core-not-started

| Code | Platform | Methods | Behavior | Startup state |
| --- | --- | --- | --- | --- |
| `NOT_STARTED` | android | `url`, `handleTappEvent` | `reject` | `before-start` |

Message (exact): `Tapp has not been started. Call start() first.`

Cause: Startup has not completed, or the native instance is absent.

Fix: Await successful Tapp.start(); avoid calls while the plugin is being destroyed.

Source: [android/src/main/java/so/tapp/capacitor/adjust/TappAdjustPlugin.kt:168](../android/src/main/java/so/tapp/capacitor/adjust/TappAdjustPlugin.kt#L168).

Notes: requireStarted uses coreGate(started, instance != null); missing instance rejects even if the started flag is true.

<a id="ios-url-input"></a>

### ios-url-input

| Code | Platform | Methods | Behavior | Startup state |
| --- | --- | --- | --- | --- |
| `INVALID_ARGUMENT` | ios | `url` | `reject` | `after-start` |

Message (exact): `influencer must be a nonempty string.`

Cause: influencer is missing, empty or not a string.

Fix: Pass a nonblank influencer string after startup.

Source: [ios/Sources/TappAdjustCapacitorPlugin/TappAdjustPlugin.swift:56](../ios/Sources/TappAdjustCapacitorPlugin/TappAdjustPlugin.swift#L56).

Notes: iOS accepts whitespace-only influencer strings; Android rejects them.

<a id="android-url-input"></a>

### android-url-input

| Code | Platform | Methods | Behavior | Startup state |
| --- | --- | --- | --- | --- |
| `INVALID_ARGUMENT` | android | `url` | `reject` | `after-start` |

Message (exact): `A nonempty influencer is required.`

Cause: influencer is missing, blank or not a string.

Fix: Pass a nonblank influencer string after startup.

Source: [android/src/main/java/so/tapp/capacitor/adjust/TappAdjustPlugin.kt:87](../android/src/main/java/so/tapp/capacitor/adjust/TappAdjustPlugin.kt#L87).

<a id="ios-url-native"></a>

### ios-url-native

| Code | Platform | Methods | Behavior | Startup state |
| --- | --- | --- | --- | --- |
| `URL_ERROR` | ios | `url` | `reject` | `after-start` |

Message (localizedDescription): `error.localizedDescription`

Cause: The native URL-generation callback returns failure.

Fix: Check startup configuration, network availability and link-generation input; handle rejection without logging sensitive native text.

Source: [ios/Sources/TappAdjustCapacitorPlugin/TappAdjustPlugin.swift:69](../ios/Sources/TappAdjustCapacitorPlugin/TappAdjustPlugin.swift#L69).

<a id="android-url-native-result"></a>

### android-url-native-result

| Code | Platform | Methods | Behavior | Startup state |
| --- | --- | --- | --- | --- |
| `URL_ERROR` | android | `url` | `reject` | `after-start` |

Message (pattern): `result.message if nonblank; otherwise "Unable to generate Tapp URL."`

Cause: The native URL-generation result has error=true.

Fix: Check startup configuration, network availability and link-generation input; handle rejection without logging sensitive native text.

Source: [android/src/main/java/so/tapp/capacitor/adjust/TappAdjustPlugin.kt:97](../android/src/main/java/so/tapp/capacitor/adjust/TappAdjustPlugin.kt#L97).

<a id="android-url-native-empty"></a>

### android-url-native-empty

| Code | Platform | Methods | Behavior | Startup state |
| --- | --- | --- | --- | --- |
| `URL_ERROR` | android | `url` | `reject` | `after-start` |

Message (exact): `No Tapp URL returned.`

Cause: The native result reports success but influencer_url is blank.

Fix: Check startup configuration, network availability and link-generation input; handle rejection without logging sensitive native text.

Source: [android/src/main/java/so/tapp/capacitor/adjust/TappAdjustPlugin.kt:99](../android/src/main/java/so/tapp/capacitor/adjust/TappAdjustPlugin.kt#L99).

<a id="android-url-native-exception"></a>

### android-url-native-exception

| Code | Platform | Methods | Behavior | Startup state |
| --- | --- | --- | --- | --- |
| `URL_ERROR` | android | `url` | `reject` | `after-start` |

Message (exact): `Unable to generate Tapp URL.`

Cause: URL generation throws a non-cancellation exception.

Fix: Check startup configuration, network availability and link-generation input; handle rejection without logging sensitive native text.

Source: [android/src/main/java/so/tapp/capacitor/adjust/TappAdjustPlugin.kt:106](../android/src/main/java/so/tapp/capacitor/adjust/TappAdjustPlugin.kt#L106).

<a id="ios-tapp-event-input"></a>

### ios-tapp-event-input

| Code | Platform | Methods | Behavior | Startup state |
| --- | --- | --- | --- | --- |
| `INVALID_ARGUMENT` | ios | `handleTappEvent` | `reject` | `after-start` |

Message (exact): `eventAction must be an integer from 0 through 40.`

Cause: eventAction is missing, the wrong type, non-finite, fractional or outside 0 through 40.

Fix: Pass a numeric integer from 0 through 40; for action 0, optionally pass customValue. Booleans and numeric strings are invalid.

Source: [ios/Sources/TappAdjustCapacitorPlugin/TappAdjustPlugin.swift:85](../ios/Sources/TappAdjustCapacitorPlugin/TappAdjustPlugin.swift#L85).

Notes: Missing or blank customValue for action 0 uses custom_event_autogenerated. Invalid metadata values are dropped rather than rejected.

<a id="android-tapp-event-input"></a>

### android-tapp-event-input

| Code | Platform | Methods | Behavior | Startup state |
| --- | --- | --- | --- | --- |
| `INVALID_ARGUMENT` | android | `handleTappEvent` | `reject` | `after-start` |

Message (exact): `eventAction must be an integer from 0 through 40.`

Cause: eventAction is missing, the wrong type, non-finite, fractional or outside 0 through 40.

Fix: Pass a numeric integer from 0 through 40; for action 0, optionally pass customValue. Booleans and numeric strings are invalid.

Source: [android/src/main/java/so/tapp/capacitor/adjust/TappAdjustPlugin.kt:116](../android/src/main/java/so/tapp/capacitor/adjust/TappAdjustPlugin.kt#L116).

Notes: Missing or blank customValue for action 0 uses custom_event_autogenerated. Invalid metadata values are dropped rather than rejected.

<a id="android-tapp-event-native"></a>

### android-tapp-event-native

| Code | Platform | Methods | Behavior | Startup state |
| --- | --- | --- | --- | --- |
| `HANDLE_EVENT_ERROR` | android | `handleTappEvent` | `reject` | `after-start` |

Message (exact): `Unable to handle Tapp event.`

Cause: The native Tapp event call throws.

Fix: Check successful startup and event input; handle native delivery failure without logging event payloads.

Source: [android/src/main/java/so/tapp/capacitor/adjust/TappAdjustPlugin.kt:124](../android/src/main/java/so/tapp/capacitor/adjust/TappAdjustPlugin.kt#L124).

<a id="ios-shouldProcess-url"></a>

### ios-shouldProcess-url

| Code | Platform | Methods | Behavior | Startup state |
| --- | --- | --- | --- | --- |
| `INVALID_URL` | ios | `shouldProcess` | `reject` | `either` |

Message (exact): `url must be a nonempty, valid URL.`

Cause: The URL is missing, blank, the wrong type, unparsable, lacks a scheme, or uses javascript:, data: or file: (case-insensitive).

Fix: Pass a nonblank absolute URL with an allowed scheme. Use native shouldProcess to decide whether Tapp handles a link.

Source: [ios/Sources/TappAdjustCapacitorPlugin/TappAdjustPlugin.swift:100](../ios/Sources/TappAdjustCapacitorPlugin/TappAdjustPlugin.swift#L100).

<a id="ios-fetchLinkData-url"></a>

### ios-fetchLinkData-url

| Code | Platform | Methods | Behavior | Startup state |
| --- | --- | --- | --- | --- |
| `INVALID_URL` | ios | `fetchLinkData` | `reject` | `either` |

Message (exact): `url must be a nonempty, valid URL.`

Cause: The URL is missing, blank, the wrong type, unparsable, lacks a scheme, or uses javascript:, data: or file: (case-insensitive).

Fix: Pass a nonblank absolute URL with an allowed scheme. Use native shouldProcess to decide whether Tapp handles a link.

Source: [ios/Sources/TappAdjustCapacitorPlugin/TappAdjustPlugin.swift:110](../ios/Sources/TappAdjustCapacitorPlugin/TappAdjustPlugin.swift#L110).

<a id="android-required-url"></a>

### android-required-url

| Code | Platform | Methods | Behavior | Startup state |
| --- | --- | --- | --- | --- |
| `INVALID_URL` | android | `shouldProcess`, `fetchLinkData` | `reject` | `either` |

Message (exact): `url must be a nonempty, valid URL.`

Cause: The URL is missing, blank, the wrong type, unparsable, lacks a scheme, or uses javascript:, data: or file: (case-insensitive).

Fix: Pass a nonblank absolute URL with an allowed scheme. Use native shouldProcess to decide whether Tapp handles a link.

Source: [android/src/main/java/so/tapp/capacitor/adjust/TappAdjustPlugin.kt:181](../android/src/main/java/so/tapp/capacitor/adjust/TappAdjustPlugin.kt#L181).

<a id="web-required-url"></a>

### web-required-url

| Code | Platform | Methods | Behavior | Startup state |
| --- | --- | --- | --- | --- |
| `INVALID_URL` | web | `shouldProcess`, `fetchLinkData` | `reject` | `either` |

Message (exact): `url must be a nonempty, valid URL.`

Cause: The URL is missing, blank, the wrong type, unparsable, lacks a scheme, or uses javascript:, data: or file: (case-insensitive).

Fix: Pass a nonblank absolute URL with an allowed scheme. Use native shouldProcess to decide whether Tapp handles a link.

Source: [src/web.ts:389](../src/web.ts#L389).

<a id="ios-fetchLinkData-not-started"></a>

### ios-fetchLinkData-not-started

| Code | Platform | Methods | Behavior | Startup state |
| --- | --- | --- | --- | --- |
| No code | ios | `fetchLinkData` | `resolve-error` | `before-start` |

Message (exact): `Tapp has not been started. Call start() first.`

Cause: Successful startup has not completed.

Fix: Await successful Tapp.start() and inspect data.error before routing.

Source: [ios/Sources/TappAdjustCapacitorPlugin/TappAdjustPlugin.swift:115](../ios/Sources/TappAdjustCapacitorPlugin/TappAdjustPlugin.swift#L115).

<a id="ios-fetchOriginLinkData-not-started"></a>

### ios-fetchOriginLinkData-not-started

| Code | Platform | Methods | Behavior | Startup state |
| --- | --- | --- | --- | --- |
| No code | ios | `fetchOriginLinkData` | `resolve-error` | `before-start` |

Message (exact): `Tapp has not been started. Call start() first.`

Cause: Successful startup has not completed.

Fix: Await successful Tapp.start() and inspect data.error before routing.

Source: [ios/Sources/TappAdjustCapacitorPlugin/TappAdjustPlugin.swift:127](../ios/Sources/TappAdjustCapacitorPlugin/TappAdjustPlugin.swift#L127).

<a id="android-link-data-not-started"></a>

### android-link-data-not-started

| Code | Platform | Methods | Behavior | Startup state |
| --- | --- | --- | --- | --- |
| No code | android | `fetchLinkData`, `fetchOriginLinkData` | `resolve-error` | `before-start` |

Message (exact): `Tapp has not been started. Call start() first.`

Cause: Successful startup has not completed.

Fix: Await successful Tapp.start() and inspect data.error before routing.

Source: [android/src/main/java/so/tapp/capacitor/adjust/TappAdjustPlugin.kt:174](../android/src/main/java/so/tapp/capacitor/adjust/TappAdjustPlugin.kt#L174).

<a id="ios-link-data-native"></a>

### ios-link-data-native

| Code | Platform | Methods | Behavior | Startup state |
| --- | --- | --- | --- | --- |
| No code | ios | `fetchLinkData`, `fetchOriginLinkData` | `resolve-error` | `after-start` |

Message (localizedDescription): `error.localizedDescription`

Cause: The native link-data callback returns failure.

Fix: Inspect data.error before routing. Check startup, link configuration and network availability; show a generic failure without logging the payload.

Source: [ios/Sources/TappAdjustCapacitorPlugin/TappAdjustPlugin.swift:140](../ios/Sources/TappAdjustCapacitorPlugin/TappAdjustPlugin.swift#L140).

<a id="android-link-data-exception"></a>

### android-link-data-exception

| Code | Platform | Methods | Behavior | Startup state |
| --- | --- | --- | --- | --- |
| No code | android | `fetchLinkData`, `fetchOriginLinkData` | `resolve-error` | `after-start` |

Message (pattern): `error.message passed through optionalString; otherwise "An unexpected error occurred"`

Cause: Link-data lookup throws a non-cancellation exception.

Fix: Inspect data.error before routing. Check startup, link configuration and network availability; show a generic failure without logging the payload.

Source: [android/src/main/java/so/tapp/capacitor/adjust/TappAdjustPlugin.kt:158](../android/src/main/java/so/tapp/capacitor/adjust/TappAdjustPlugin.kt#L158).

Notes: Fallback and filtering are in TappAdjustMapping.kt:96-106. Cancellation is rethrown internally, not converted to a bridge error code.

<a id="android-link-data-null"></a>

### android-link-data-null

| Code | Platform | Methods | Behavior | Startup state |
| --- | --- | --- | --- | --- |
| No code | android | `fetchLinkData`, `fetchOriginLinkData` | `resolve-error` | `after-start` |

Message (exact): `No link data returned`

Cause: Native link-data response is null.

Fix: Inspect data.error before routing. Check startup, link configuration and network availability; show a generic failure without logging the payload.

Source: [android/src/main/java/so/tapp/capacitor/adjust/TappAdjustMapping.kt:110](../android/src/main/java/so/tapp/capacitor/adjust/TappAdjustMapping.kt#L110).

<a id="android-link-data-result"></a>

### android-link-data-result

| Code | Platform | Methods | Behavior | Startup state |
| --- | --- | --- | --- | --- |
| No code | android | `fetchLinkData`, `fetchOriginLinkData` | `resolve-error` | `after-start` |

Message (pattern): `response.message passed through optionalString; otherwise "An unexpected error occurred"`

Cause: Native response.error is true.

Fix: Inspect data.error before routing. Check startup, link configuration and network availability; show a generic failure without logging the payload.

Source: [android/src/main/java/so/tapp/capacitor/adjust/TappAdjustMapping.kt:111](../android/src/main/java/so/tapp/capacitor/adjust/TappAdjustMapping.kt#L111).

<a id="android-link-data-fallback"></a>

### android-link-data-fallback

| Code | Platform | Methods | Behavior | Startup state |
| --- | --- | --- | --- | --- |
| No code | android | `fetchLinkData`, `fetchOriginLinkData` | `resolve-error` | `either` |

Message (exact): `An unexpected error occurred`

Cause: The error helper receives a missing or filtered-out message.

Fix: Inspect data.error before routing. Check startup, link configuration and network availability; show a generic failure without logging the payload.

Source: [android/src/main/java/so/tapp/capacitor/adjust/TappAdjustMapping.kt:106](../android/src/main/java/so/tapp/capacitor/adjust/TappAdjustMapping.kt#L106).

Notes: optionalString filters blank strings, case-insensitive null, -1, and the four missing-field sentinels listed at TappAdjustMapping.kt:91-94. Shared helper used by the Android link-data sites above.

<a id="web-link-data"></a>

### web-link-data

| Code | Platform | Methods | Behavior | Startup state |
| --- | --- | --- | --- | --- |
| No code | web | `fetchLinkData`, `fetchOriginLinkData` | `resolve-error` | `either` |

Message (exact): `Tapp is not supported on web.`

Cause: Link-data APIs are called on web (fetchLinkData URL is valid).

Fix: Run link resolution on iOS or Android and inspect data.error before routing.

Source: [src/web.ts:396](../src/web.ts#L396).

<a id="ios-adjust-platform"></a>

### ios-adjust-platform

| Code | Platform | Methods | Behavior | Startup state |
| --- | --- | --- | --- | --- |
| `UNIMPLEMENTED` | ios | `adjustTrackPlayStoreSubscription`, `adjustVerifyPlayStorePurchase`, `adjustVerifyAndTrackPlayStorePurchase`, `adjustGetGoogleAdId`, `adjustGetAmazonAdId`, `adjustGetGooglePlayInstallReferrer`, `adjustSetReferrer` | `reject` | `either` |

Message (pattern): `{method} is not available on iOS.`

Cause: An Android-only method is called on iOS.

Fix: Gate the call by platform and use this method only on Android.

Source: [ios/Sources/TappAdjustCapacitorPlugin/TappAdjustMapping.swift:54](../ios/Sources/TappAdjustCapacitorPlugin/TappAdjustMapping.swift#L54).

Notes: Substitute the exact method name from methods. Forwarded by TappAdjustPlugin.swift:176; platform gate precedes startup and input validation.

<a id="ios-adjust-not-started"></a>

### ios-adjust-not-started

| Code | Platform | Methods | Behavior | Startup state |
| --- | --- | --- | --- | --- |
| `NOT_STARTED` | ios | `handleEvent`, `getAdjustAttribution`, `adjustGetAdid`, `adjustGetIdfa`, `adjustTrackAdRevenue`, `adjustSetPushToken`, `adjustGdprForgetMe`, `adjustTrackThirdPartySharing`, `adjustTrackMeasurementConsent`, `adjustEnable`, `adjustDisable`, `adjustIsEnabled`, `adjustSwitchToOfflineMode`, `adjustSwitchBackToOnlineMode`, `adjustAddGlobalCallbackParameter`, `adjustAddGlobalPartnerParameter`, `adjustRemoveGlobalCallbackParameter`, `adjustRemoveGlobalPartnerParameter`, `adjustRemoveGlobalCallbackParameters`, `adjustRemoveGlobalPartnerParameters`, `adjustGetSdkVersion`, `adjustVerifyAppStorePurchase`, `adjustTrackAppStoreSubscription`, `adjustConvert`, `adjustRequestAppTrackingAuthorization`, `adjustAppTrackingAuthorizationStatus`, `adjustUpdateSkanConversionValue` | `reject` | `before-start` |

Message (exact): `Tapp has not been started. Call start() first.`

Cause: A supported Adjust method is called before successful startup.

Fix: Await successful Tapp.start() before calling Adjust APIs.

Source: [ios/Sources/TappAdjustCapacitorPlugin/TappAdjustMapping.swift:57](../ios/Sources/TappAdjustCapacitorPlugin/TappAdjustMapping.swift#L57).

Notes: Forwarded by TappAdjustPlugin.swift:176, before input validation.

<a id="ios-android-only-fallback"></a>

### ios-android-only-fallback

| Code | Platform | Methods | Behavior | Startup state |
| --- | --- | --- | --- | --- |
| `UNIMPLEMENTED` | ios | `adjustTrackPlayStoreSubscription`, `adjustVerifyPlayStorePurchase`, `adjustVerifyAndTrackPlayStorePurchase`, `adjustGetGoogleAdId`, `adjustGetAmazonAdId`, `adjustGetGooglePlayInstallReferrer`, `adjustSetReferrer` | `reject` | `either` |

Message (pattern): `{method} is not available on iOS.`

Cause: Defensive rejection in androidOnly if its gated body is reached.

Fix: Call these methods only on Android.

Source: [ios/Sources/TappAdjustCapacitorPlugin/TappAdjustPlugin.swift:200](../ios/Sources/TappAdjustCapacitorPlugin/TappAdjustPlugin.swift#L200).

Notes: Currently unreachable: the mapping platform gate rejects the same methods first. Included to record the explicit source rejection site.

<a id="android-adjust-platform"></a>

### android-adjust-platform

| Code | Platform | Methods | Behavior | Startup state |
| --- | --- | --- | --- | --- |
| `UNIMPLEMENTED` | android | `adjustVerifyAppStorePurchase`, `adjustTrackAppStoreSubscription`, `adjustConvert`, `adjustRequestAppTrackingAuthorization`, `adjustAppTrackingAuthorizationStatus`, `adjustUpdateSkanConversionValue` | `reject` | `either` |

Message (pattern): `{method} is not available on Android.`

Cause: An iOS-only method is called on Android.

Fix: Gate the call by platform and use this method only on iOS.

Source: [android/src/main/java/so/tapp/capacitor/adjust/TappAdjustPlugin.kt:504](../android/src/main/java/so/tapp/capacitor/adjust/TappAdjustPlugin.kt#L504).

Notes: Exact template is TappAdjustMapping.kt:164. Platform gate precedes startup and input validation.

<a id="android-adjust-not-started"></a>

### android-adjust-not-started

| Code | Platform | Methods | Behavior | Startup state |
| --- | --- | --- | --- | --- |
| `NOT_STARTED` | android | `handleEvent`, `getAdjustAttribution`, `adjustGetAdid`, `adjustGetIdfa`, `adjustTrackAdRevenue`, `adjustSetPushToken`, `adjustGdprForgetMe`, `adjustTrackThirdPartySharing`, `adjustTrackMeasurementConsent`, `adjustEnable`, `adjustDisable`, `adjustIsEnabled`, `adjustSwitchToOfflineMode`, `adjustSwitchBackToOnlineMode`, `adjustAddGlobalCallbackParameter`, `adjustAddGlobalPartnerParameter`, `adjustRemoveGlobalCallbackParameter`, `adjustRemoveGlobalPartnerParameter`, `adjustRemoveGlobalCallbackParameters`, `adjustRemoveGlobalPartnerParameters`, `adjustGetSdkVersion`, `adjustTrackPlayStoreSubscription`, `adjustVerifyPlayStorePurchase`, `adjustVerifyAndTrackPlayStorePurchase`, `adjustGetGoogleAdId`, `adjustGetAmazonAdId`, `adjustGetGooglePlayInstallReferrer`, `adjustSetReferrer` | `reject` | `before-start` |

Message (exact): `Tapp has not been started. Call start() first.`

Cause: A supported Adjust method is called before successful startup.

Fix: Await successful Tapp.start() before calling Adjust APIs.

Source: [android/src/main/java/so/tapp/capacitor/adjust/TappAdjustPlugin.kt:508](../android/src/main/java/so/tapp/capacitor/adjust/TappAdjustPlugin.kt#L508).

<a id="android-adjust-missing-instance"></a>

### android-adjust-missing-instance

| Code | Platform | Methods | Behavior | Startup state |
| --- | --- | --- | --- | --- |
| `NOT_STARTED` | android | `handleEvent`, `getAdjustAttribution`, `adjustGetAdid`, `adjustGetIdfa`, `adjustTrackAdRevenue`, `adjustSetPushToken`, `adjustGdprForgetMe`, `adjustTrackThirdPartySharing`, `adjustTrackMeasurementConsent`, `adjustEnable`, `adjustDisable`, `adjustIsEnabled`, `adjustSwitchToOfflineMode`, `adjustSwitchBackToOnlineMode`, `adjustAddGlobalCallbackParameter`, `adjustAddGlobalPartnerParameter`, `adjustRemoveGlobalCallbackParameter`, `adjustRemoveGlobalPartnerParameter`, `adjustRemoveGlobalCallbackParameters`, `adjustRemoveGlobalPartnerParameters`, `adjustGetSdkVersion`, `adjustTrackPlayStoreSubscription`, `adjustVerifyPlayStorePurchase`, `adjustVerifyAndTrackPlayStorePurchase`, `adjustGetGoogleAdId`, `adjustGetAmazonAdId`, `adjustGetGooglePlayInstallReferrer`, `adjustSetReferrer` | `reject` | `before-start` |

Message (exact): `Tapp has not been started. Call start() first.`

Cause: The gate permits the call but the native instance is absent.

Fix: Await successful startup and avoid calls while the plugin is being destroyed.

Source: [android/src/main/java/so/tapp/capacitor/adjust/TappAdjustPlugin.kt:512](../android/src/main/java/so/tapp/capacitor/adjust/TappAdjustPlugin.kt#L512).

Notes: Defensive instance check after the started flag gate.

<a id="ios-event-token"></a>

### ios-event-token

| Code | Platform | Methods | Behavior | Startup state |
| --- | --- | --- | --- | --- |
| `INVALID_ARGUMENT` | ios | `handleEvent` | `reject` | `after-start` |

Message (exact): `eventToken must be a nonblank string.`

Cause: eventToken is missing, blank or not a string.

Fix: Pass the dashboard Adjust event token as a nonblank string; never log it.

Source: [ios/Sources/TappAdjustCapacitorPlugin/TappAdjustPlugin.swift:213](../ios/Sources/TappAdjustCapacitorPlugin/TappAdjustPlugin.swift#L213).

<a id="ios-ad-revenue"></a>

### ios-ad-revenue

| Code | Platform | Methods | Behavior | Startup state |
| --- | --- | --- | --- | --- |
| `INVALID_ARGUMENT` | ios | `adjustTrackAdRevenue` | `reject` | `after-start` |

Message (exact): `source and currency must be nonblank strings; revenue must be a finite, non-negative number.`

Cause: source or currency is missing, blank or the wrong type, or revenue is missing, nonnumeric, non-finite or negative.

Fix: Pass nonblank source and currency strings and a finite numeric revenue greater than or equal to zero.

Source: [ios/Sources/TappAdjustCapacitorPlugin/TappAdjustPlugin.swift:256](../ios/Sources/TappAdjustCapacitorPlugin/TappAdjustPlugin.swift#L256).

<a id="ios-push-token"></a>

### ios-push-token

| Code | Platform | Methods | Behavior | Startup state |
| --- | --- | --- | --- | --- |
| `INVALID_ARGUMENT` | ios | `adjustSetPushToken` | `reject` | `after-start` |

Message (exact): `token must be a nonblank string.`

Cause: token is missing, blank or not a string.

Fix: Pass a nonblank push token string without logging it.

Source: [ios/Sources/TappAdjustCapacitorPlugin/TappAdjustPlugin.swift:267](../ios/Sources/TappAdjustCapacitorPlugin/TappAdjustPlugin.swift#L267).

<a id="ios-third-party-sharing"></a>

### ios-third-party-sharing

| Code | Platform | Methods | Behavior | Startup state |
| --- | --- | --- | --- | --- |
| `INVALID_ARGUMENT` | ios | `adjustTrackThirdPartySharing` | `reject` | `after-start` |

Message (exact): `enabled must be a boolean.`

Cause: enabled is missing or not a boolean.

Fix: Pass enabled as true or false; numeric and string values are invalid.

Source: [ios/Sources/TappAdjustCapacitorPlugin/TappAdjustPlugin.swift:282](../ios/Sources/TappAdjustCapacitorPlugin/TappAdjustPlugin.swift#L282).

<a id="ios-measurement-consent"></a>

### ios-measurement-consent

| Code | Platform | Methods | Behavior | Startup state |
| --- | --- | --- | --- | --- |
| `INVALID_ARGUMENT` | ios | `adjustTrackMeasurementConsent` | `reject` | `after-start` |

Message (exact): `consent must be a boolean.`

Cause: consent is missing or not a boolean.

Fix: Pass consent as true or false; numeric and string values are invalid.

Source: [ios/Sources/TappAdjustCapacitorPlugin/TappAdjustPlugin.swift:293](../ios/Sources/TappAdjustCapacitorPlugin/TappAdjustPlugin.swift#L293).

<a id="ios-add-callback"></a>

### ios-add-callback

| Code | Platform | Methods | Behavior | Startup state |
| --- | --- | --- | --- | --- |
| `INVALID_ARGUMENT` | ios | `adjustAddGlobalCallbackParameter` | `reject` | `after-start` |

Message (exact): `key and value must be nonblank strings.`

Cause: key or value is missing, blank or not a string.

Fix: Pass both key and value as nonblank strings.

Source: [ios/Sources/TappAdjustCapacitorPlugin/TappAdjustPlugin.swift:329](../ios/Sources/TappAdjustCapacitorPlugin/TappAdjustPlugin.swift#L329).

<a id="ios-add-partner"></a>

### ios-add-partner

| Code | Platform | Methods | Behavior | Startup state |
| --- | --- | --- | --- | --- |
| `INVALID_ARGUMENT` | ios | `adjustAddGlobalPartnerParameter` | `reject` | `after-start` |

Message (exact): `key and value must be nonblank strings.`

Cause: key or value is missing, blank or not a string.

Fix: Pass both key and value as nonblank strings.

Source: [ios/Sources/TappAdjustCapacitorPlugin/TappAdjustPlugin.swift:339](../ios/Sources/TappAdjustCapacitorPlugin/TappAdjustPlugin.swift#L339).

<a id="ios-remove-callback"></a>

### ios-remove-callback

| Code | Platform | Methods | Behavior | Startup state |
| --- | --- | --- | --- | --- |
| `INVALID_ARGUMENT` | ios | `adjustRemoveGlobalCallbackParameter` | `reject` | `after-start` |

Message (exact): `key must be a nonblank string.`

Cause: key is missing, blank or not a string.

Fix: Pass key as a nonblank string.

Source: [ios/Sources/TappAdjustCapacitorPlugin/TappAdjustPlugin.swift:349](../ios/Sources/TappAdjustCapacitorPlugin/TappAdjustPlugin.swift#L349).

<a id="ios-remove-partner"></a>

### ios-remove-partner

| Code | Platform | Methods | Behavior | Startup state |
| --- | --- | --- | --- | --- |
| `INVALID_ARGUMENT` | ios | `adjustRemoveGlobalPartnerParameter` | `reject` | `after-start` |

Message (exact): `key must be a nonblank string.`

Cause: key is missing, blank or not a string.

Fix: Pass key as a nonblank string.

Source: [ios/Sources/TappAdjustCapacitorPlugin/TappAdjustPlugin.swift:360](../ios/Sources/TappAdjustCapacitorPlugin/TappAdjustPlugin.swift#L360).

<a id="ios-app-store-purchase"></a>

### ios-app-store-purchase

| Code | Platform | Methods | Behavior | Startup state |
| --- | --- | --- | --- | --- |
| `INVALID_ARGUMENT` | ios | `adjustVerifyAppStorePurchase` | `reject` | `after-start` |

Message (exact): `transactionId and productId must be nonblank strings.`

Cause: transactionId or productId is missing, blank or not a string.

Fix: Pass the App Store transactionId and productId as nonblank strings.

Source: [ios/Sources/TappAdjustCapacitorPlugin/TappAdjustPlugin.swift:389](../ios/Sources/TappAdjustCapacitorPlugin/TappAdjustPlugin.swift#L389).

<a id="ios-app-store-subscription"></a>

### ios-app-store-subscription

| Code | Platform | Methods | Behavior | Startup state |
| --- | --- | --- | --- | --- |
| `INVALID_ARGUMENT` | ios | `adjustTrackAppStoreSubscription` | `reject` | `after-start` |

Message (exact): `price must be a finite number; currency and transactionId must be nonblank strings.`

Cause: Input validation or native AdjustAppStoreSubscription construction fails.

Fix: Pass finite numeric price and nonblank currency and transactionId strings; numeric strings and booleans are invalid.

Source: [ios/Sources/TappAdjustCapacitorPlugin/TappAdjustPlugin.swift:416](../ios/Sources/TappAdjustCapacitorPlugin/TappAdjustPlugin.swift#L416).

<a id="ios-convert-scheme"></a>

### ios-convert-scheme

| Code | Platform | Methods | Behavior | Startup state |
| --- | --- | --- | --- | --- |
| `INVALID_ARGUMENT` | ios | `adjustConvert` | `reject` | `after-start` |

Message (exact): `scheme must be a nonblank string.`

Cause: scheme is missing, blank or not a string after universalLink validation.

Fix: Pass a nonblank target scheme string and a valid universalLink.

Source: [ios/Sources/TappAdjustCapacitorPlugin/TappAdjustPlugin.swift:431](../ios/Sources/TappAdjustCapacitorPlugin/TappAdjustPlugin.swift#L431).

<a id="ios-skan-input"></a>

### ios-skan-input

| Code | Platform | Methods | Behavior | Startup state |
| --- | --- | --- | --- | --- |
| `INVALID_ARGUMENT` | ios | `adjustUpdateSkanConversionValue` | `reject` | `after-start` |

Message (exact): `value must be an integer; coarseValue must be a nonblank string and lockWindow a number when present.`

Cause: value is missing, non-finite, fractional, not representable as native Int or the wrong type; an optional field has an invalid value.

Fix: Pass an integer value, optional nonblank coarseValue and optional finite numeric lockWindow. Null optional fields count as absent.

Source: [ios/Sources/TappAdjustCapacitorPlugin/TappAdjustPlugin.swift:456](../ios/Sources/TappAdjustCapacitorPlugin/TappAdjustPlugin.swift#L456).

Notes: The iOS mapping also accepts a boolean lockWindow despite the message and TypeScript number type. No SKAN value range is enforced by this bridge.

<a id="ios-convert-url"></a>

### ios-convert-url

| Code | Platform | Methods | Behavior | Startup state |
| --- | --- | --- | --- | --- |
| `INVALID_URL` | ios | `adjustConvert` | `reject` | `after-start` |

Message (exact): `universalLink must be a nonempty, valid URL.`

Cause: universalLink is missing, blank, the wrong type, unparsable, lacks a scheme, or uses javascript:, data: or file: (case-insensitive).

Fix: Pass a valid absolute universalLink with an allowed scheme and a nonblank target scheme.

Source: [ios/Sources/TappAdjustCapacitorPlugin/TappAdjustPlugin.swift:427](../ios/Sources/TappAdjustCapacitorPlugin/TappAdjustPlugin.swift#L427).

Notes: Uses parsedURL, like core URL validation, but runs after the platform and startup gates and before scheme validation.

<a id="ios-skan-native"></a>

### ios-skan-native

| Code | Platform | Methods | Behavior | Startup state |
| --- | --- | --- | --- | --- |
| `SKAN_ERROR` | ios | `adjustUpdateSkanConversionValue` | `reject` | `after-start` |

Message (localizedDescription): `error.localizedDescription`

Cause: Native SKAN completion returns an error.

Fix: Check SKAdNetwork setup and supported conversion values on the target iOS device; handle the native failure.

Source: [ios/Sources/TappAdjustCapacitorPlugin/TappAdjustPlugin.swift:463](../ios/Sources/TappAdjustCapacitorPlugin/TappAdjustPlugin.swift#L463).

<a id="ios-purchase-no-result"></a>

### ios-purchase-no-result

| Code | Platform | Methods | Behavior | Startup state |
| --- | --- | --- | --- | --- |
| `UNAVAILABLE` | ios | `adjustVerifyAppStorePurchase` | `reject` | `after-start` |

Message (exact): `Purchase verification returned no result.`

Cause: The native verification callback supplies nil.

Fix: Check the App Store transaction and product identifiers and native purchase-verification setup; handle an unavailable result.

Source: [ios/Sources/TappAdjustCapacitorPlugin/TappAdjustPlugin.swift:396](../ios/Sources/TappAdjustCapacitorPlugin/TappAdjustPlugin.swift#L396).

<a id="android-adjust-event-native"></a>

### android-adjust-event-native

| Code | Platform | Methods | Behavior | Startup state |
| --- | --- | --- | --- | --- |
| `HANDLE_EVENT_ERROR` | android | `handleEvent` | `reject` | `after-start` |

Message (exact): `Unable to handle Adjust event.`

Cause: The native Adjust event call throws.

Fix: Check startup and the Adjust event token configured for the app; handle delivery failure without logging the token.

Source: [android/src/main/java/so/tapp/capacitor/adjust/TappAdjustPlugin.kt:223](../android/src/main/java/so/tapp/capacitor/adjust/TappAdjustPlugin.kt#L223).

<a id="android-ad-revenue-input"></a>

### android-ad-revenue-input

| Code | Platform | Methods | Behavior | Startup state |
| --- | --- | --- | --- | --- |
| `INVALID_ARGUMENT` | android | `adjustTrackAdRevenue` | `reject` | `after-start` |

Message (exact): `Nonempty source and currency and a finite, non-negative revenue are required.`

Cause: source or currency is missing, blank or the wrong type, or revenue is missing, nonnumeric, non-finite or negative.

Fix: Pass nonblank source and currency strings and finite numeric revenue greater than or equal to zero.

Source: [android/src/main/java/so/tapp/capacitor/adjust/TappAdjustPlugin.kt:257](../android/src/main/java/so/tapp/capacitor/adjust/TappAdjustPlugin.kt#L257).

<a id="android-subscription-input"></a>

### android-subscription-input

| Code | Platform | Methods | Behavior | Startup state |
| --- | --- | --- | --- | --- |
| `INVALID_ARGUMENT` | android | `adjustTrackPlayStoreSubscription` | `reject` | `after-start` |

Message (exact): `A finite price, optional finite purchaseTime, and nonempty currency, sku, orderId, signature, and purchaseToken are required.`

Cause: A required string is missing, blank or the wrong type, or price or a supplied purchaseTime is not a finite number.

Fix: Pass all required strings, numeric price in micro-units and optional finite numeric purchaseTime. Never log purchase data.

Source: [android/src/main/java/so/tapp/capacitor/adjust/TappAdjustPlugin.kt:415](../android/src/main/java/so/tapp/capacitor/adjust/TappAdjustPlugin.kt#L415).

Notes: Null purchaseTime counts as absent. Native Long conversion truncates fractional price and purchaseTime toward zero; fractional input does not reject. The bridge does not impose non-negativity on these fields.

<a id="android-purchase-input"></a>

### android-purchase-input

| Code | Platform | Methods | Behavior | Startup state |
| --- | --- | --- | --- | --- |
| `INVALID_ARGUMENT` | android | `adjustVerifyPlayStorePurchase` | `reject` | `after-start` |

Message (exact): `Nonempty transactionId and productId are required.`

Cause: transactionId or productId is missing, blank or not a string.

Fix: Pass the Play purchase token as transactionId and the product identifier as productId; never log the purchase token.

Source: [android/src/main/java/so/tapp/capacitor/adjust/TappAdjustPlugin.kt:436](../android/src/main/java/so/tapp/capacitor/adjust/TappAdjustPlugin.kt#L436).

<a id="android-required-string"></a>

### android-required-string

| Code | Platform | Methods | Behavior | Startup state |
| --- | --- | --- | --- | --- |
| `INVALID_ARGUMENT` | android | `handleEvent`, `adjustSetPushToken`, `adjustRemoveGlobalCallbackParameter`, `adjustRemoveGlobalPartnerParameter`, `adjustVerifyAndTrackPlayStorePurchase`, `adjustSetReferrer` | `reject` | `after-start` |

Message (pattern): `A nonempty {key} is required.`

Cause: A required string field is missing, blank (including whitespace-only) or the wrong type.

Fix: Pass the required field as a nonblank string; never log tokens or referrer data.

Source: [android/src/main/java/so/tapp/capacitor/adjust/TappAdjustPlugin.kt:520](../android/src/main/java/so/tapp/capacitor/adjust/TappAdjustPlugin.kt#L520).

Notes: key substitutions: handleEvent and adjustVerifyAndTrackPlayStorePurchase → eventToken; adjustSetPushToken → token; adjustRemoveGlobalCallbackParameter and adjustRemoveGlobalPartnerParameter → key; adjustSetReferrer → referrer.

<a id="android-required-boolean"></a>

### android-required-boolean

| Code | Platform | Methods | Behavior | Startup state |
| --- | --- | --- | --- | --- |
| `INVALID_ARGUMENT` | android | `adjustTrackThirdPartySharing`, `adjustTrackMeasurementConsent` | `reject` | `after-start` |

Message (pattern): `{key} must be a boolean.`

Cause: A required boolean is missing or has the wrong type.

Fix: Pass enabled or consent as true or false; numeric and string values are invalid.

Source: [android/src/main/java/so/tapp/capacitor/adjust/TappAdjustPlugin.kt:526](../android/src/main/java/so/tapp/capacitor/adjust/TappAdjustPlugin.kt#L526).

Notes: key is enabled for adjustTrackThirdPartySharing and consent for adjustTrackMeasurementConsent.

<a id="android-global-parameter-input"></a>

### android-global-parameter-input

| Code | Platform | Methods | Behavior | Startup state |
| --- | --- | --- | --- | --- |
| `INVALID_ARGUMENT` | android | `adjustAddGlobalCallbackParameter`, `adjustAddGlobalPartnerParameter` | `reject` | `after-start` |

Message (exact): `Nonempty key and value are required.`

Cause: key or value is missing, blank or not a string.

Fix: Pass both key and value as nonblank strings.

Source: [android/src/main/java/so/tapp/capacitor/adjust/TappAdjustPlugin.kt:534](../android/src/main/java/so/tapp/capacitor/adjust/TappAdjustPlugin.kt#L534).

<a id="android-install-referrer-native"></a>

### android-install-referrer-native

| Code | Platform | Methods | Behavior | Startup state |
| --- | --- | --- | --- | --- |
| `INSTALL_REFERRER_ERROR` | android | `adjustGetGooglePlayInstallReferrer` | `reject` | `after-start` |

Message (exact): `Unable to read the Google Play install referrer.`

Cause: The native install-referrer listener calls onFail.

Fix: Check Google Play installation and install-referrer service availability on the device; handle the unavailable read.

Source: [android/src/main/java/so/tapp/capacitor/adjust/TappAdjustPlugin.kt:487](../android/src/main/java/so/tapp/capacitor/adjust/TappAdjustPlugin.kt#L487).

Notes: Native failure text is deliberately discarded. A null onInstallReferrerRead result resolves an empty object instead.

<a id="android-purchase-no-result"></a>

### android-purchase-no-result

| Code | Platform | Methods | Behavior | Startup state |
| --- | --- | --- | --- | --- |
| `UNAVAILABLE` | android | `adjustVerifyPlayStorePurchase`, `adjustVerifyAndTrackPlayStorePurchase` | `reject` | `after-start` |

Message (exact): `The Adjust SDK returned no verification result.`

Cause: The verification callback returns null, or its verificationStatus or message is null.

Fix: Check purchase-verification setup and method input, and handle the unavailable result.

Source: [android/src/main/java/so/tapp/capacitor/adjust/TappAdjustPlugin.kt:553](../android/src/main/java/so/tapp/capacitor/adjust/TappAdjustPlugin.kt#L553).

Notes: verifyResult in TappAdjustMapping.kt returns null when a required field is absent. A nonnull result with a verification failure status still resolves as VerifyResult; its numeric code is not a bridge error code.

<a id="android-adjust-native-void"></a>

### android-adjust-native-void

| Code | Platform | Methods | Behavior | Startup state |
| --- | --- | --- | --- | --- |
| `UNAVAILABLE` | android | `adjustTrackAdRevenue`, `adjustSetPushToken`, `adjustGdprForgetMe`, `adjustTrackThirdPartySharing`, `adjustTrackMeasurementConsent`, `adjustEnable`, `adjustDisable`, `adjustSwitchToOfflineMode`, `adjustSwitchBackToOnlineMode`, `adjustAddGlobalCallbackParameter`, `adjustAddGlobalPartnerParameter`, `adjustRemoveGlobalCallbackParameter`, `adjustRemoveGlobalPartnerParameter`, `adjustRemoveGlobalCallbackParameters`, `adjustRemoveGlobalPartnerParameters`, `adjustTrackPlayStoreSubscription`, `adjustSetReferrer` | `reject` | `after-start` |

Message (exact): `The Adjust SDK call failed.`

Cause: A synchronous exception escapes the wrapped native Adjust call.

Fix: Check successful startup, method input and native Adjust configuration; handle the failure without logging native payloads.

Source: [android/src/main/java/so/tapp/capacitor/adjust/TappAdjustPlugin.kt:570](../android/src/main/java/so/tapp/capacitor/adjust/TappAdjustPlugin.kt#L570).

Notes: Message is ADJUST_FAILED from TappAdjustMapping.kt:124, not an error code. Native text is discarded.

<a id="android-adjust-native-callback"></a>

### android-adjust-native-callback

| Code | Platform | Methods | Behavior | Startup state |
| --- | --- | --- | --- | --- |
| `UNAVAILABLE` | android | `getAdjustAttribution`, `adjustGetAdid`, `adjustGetIdfa`, `adjustIsEnabled`, `adjustGetSdkVersion`, `adjustVerifyPlayStorePurchase`, `adjustVerifyAndTrackPlayStorePurchase`, `adjustGetGoogleAdId`, `adjustGetAmazonAdId`, `adjustGetGooglePlayInstallReferrer` | `reject` | `after-start` |

Message (exact): `The Adjust SDK call failed.`

Cause: A synchronous exception escapes the wrapped native Adjust call.

Fix: Check successful startup, method input and native Adjust configuration; handle the failure without logging native payloads.

Source: [android/src/main/java/so/tapp/capacitor/adjust/TappAdjustPlugin.kt:579](../android/src/main/java/so/tapp/capacitor/adjust/TappAdjustPlugin.kt#L579).

Notes: Message is ADJUST_FAILED from TappAdjustMapping.kt:124, not an error code. Native text is discarded. Rejection occurs only if the callback has not already settled the call.

<a id="web-url-unsupported"></a>

### web-url-unsupported

| Code | Platform | Methods | Behavior | Startup state |
| --- | --- | --- | --- | --- |
| `UNIMPLEMENTED` | web | `url` | `reject` | `either` |

Message (exact): `Not implemented on web.`

Cause: This API requires a supported native platform.

Fix: Gate the call by platform and use a supported iOS or Android implementation.

Source: [src/web.ts:66](../src/web.ts#L66).

<a id="web-handleTappEvent-unsupported"></a>

### web-handleTappEvent-unsupported

| Code | Platform | Methods | Behavior | Startup state |
| --- | --- | --- | --- | --- |
| `UNIMPLEMENTED` | web | `handleTappEvent` | `reject` | `either` |

Message (exact): `Not implemented on web.`

Cause: This API requires a supported native platform.

Fix: Gate the call by platform and use a supported iOS or Android implementation.

Source: [src/web.ts:74](../src/web.ts#L74).

<a id="web-handleEvent-unsupported"></a>

### web-handleEvent-unsupported

| Code | Platform | Methods | Behavior | Startup state |
| --- | --- | --- | --- | --- |
| `UNIMPLEMENTED` | web | `handleEvent` | `reject` | `either` |

Message (exact): `Not implemented on web.`

Cause: This API requires a supported native platform.

Fix: Gate the call by platform and use a supported iOS or Android implementation.

Source: [src/web.ts:108](../src/web.ts#L108).

<a id="web-getAdjustAttribution-unsupported"></a>

### web-getAdjustAttribution-unsupported

| Code | Platform | Methods | Behavior | Startup state |
| --- | --- | --- | --- | --- |
| `UNIMPLEMENTED` | web | `getAdjustAttribution` | `reject` | `either` |

Message (exact): `Not implemented on web.`

Cause: This API requires a supported native platform.

Fix: Gate the call by platform and use a supported iOS or Android implementation.

Source: [src/web.ts:116](../src/web.ts#L116).

<a id="web-adjustGetAdid-unsupported"></a>

### web-adjustGetAdid-unsupported

| Code | Platform | Methods | Behavior | Startup state |
| --- | --- | --- | --- | --- |
| `UNIMPLEMENTED` | web | `adjustGetAdid` | `reject` | `either` |

Message (exact): `Not implemented on web.`

Cause: This API requires a supported native platform.

Fix: Gate the call by platform and use a supported iOS or Android implementation.

Source: [src/web.ts:124](../src/web.ts#L124).

<a id="web-adjustGetIdfa-unsupported"></a>

### web-adjustGetIdfa-unsupported

| Code | Platform | Methods | Behavior | Startup state |
| --- | --- | --- | --- | --- |
| `UNIMPLEMENTED` | web | `adjustGetIdfa` | `reject` | `either` |

Message (exact): `Not implemented on web.`

Cause: This API requires a supported native platform.

Fix: Gate the call by platform and use a supported iOS or Android implementation.

Source: [src/web.ts:132](../src/web.ts#L132).

<a id="web-adjustTrackAdRevenue-unsupported"></a>

### web-adjustTrackAdRevenue-unsupported

| Code | Platform | Methods | Behavior | Startup state |
| --- | --- | --- | --- | --- |
| `UNIMPLEMENTED` | web | `adjustTrackAdRevenue` | `reject` | `either` |

Message (exact): `Not implemented on web.`

Cause: This API requires a supported native platform.

Fix: Gate the call by platform and use a supported iOS or Android implementation.

Source: [src/web.ts:140](../src/web.ts#L140).

<a id="web-adjustSetPushToken-unsupported"></a>

### web-adjustSetPushToken-unsupported

| Code | Platform | Methods | Behavior | Startup state |
| --- | --- | --- | --- | --- |
| `UNIMPLEMENTED` | web | `adjustSetPushToken` | `reject` | `either` |

Message (exact): `Not implemented on web.`

Cause: This API requires a supported native platform.

Fix: Gate the call by platform and use a supported iOS or Android implementation.

Source: [src/web.ts:148](../src/web.ts#L148).

<a id="web-adjustGdprForgetMe-unsupported"></a>

### web-adjustGdprForgetMe-unsupported

| Code | Platform | Methods | Behavior | Startup state |
| --- | --- | --- | --- | --- |
| `UNIMPLEMENTED` | web | `adjustGdprForgetMe` | `reject` | `either` |

Message (exact): `Not implemented on web.`

Cause: This API requires a supported native platform.

Fix: Gate the call by platform and use a supported iOS or Android implementation.

Source: [src/web.ts:156](../src/web.ts#L156).

<a id="web-adjustTrackThirdPartySharing-unsupported"></a>

### web-adjustTrackThirdPartySharing-unsupported

| Code | Platform | Methods | Behavior | Startup state |
| --- | --- | --- | --- | --- |
| `UNIMPLEMENTED` | web | `adjustTrackThirdPartySharing` | `reject` | `either` |

Message (exact): `Not implemented on web.`

Cause: This API requires a supported native platform.

Fix: Gate the call by platform and use a supported iOS or Android implementation.

Source: [src/web.ts:164](../src/web.ts#L164).

<a id="web-adjustTrackMeasurementConsent-unsupported"></a>

### web-adjustTrackMeasurementConsent-unsupported

| Code | Platform | Methods | Behavior | Startup state |
| --- | --- | --- | --- | --- |
| `UNIMPLEMENTED` | web | `adjustTrackMeasurementConsent` | `reject` | `either` |

Message (exact): `Not implemented on web.`

Cause: This API requires a supported native platform.

Fix: Gate the call by platform and use a supported iOS or Android implementation.

Source: [src/web.ts:172](../src/web.ts#L172).

<a id="web-adjustEnable-unsupported"></a>

### web-adjustEnable-unsupported

| Code | Platform | Methods | Behavior | Startup state |
| --- | --- | --- | --- | --- |
| `UNIMPLEMENTED` | web | `adjustEnable` | `reject` | `either` |

Message (exact): `Not implemented on web.`

Cause: This API requires a supported native platform.

Fix: Gate the call by platform and use a supported iOS or Android implementation.

Source: [src/web.ts:180](../src/web.ts#L180).

<a id="web-adjustDisable-unsupported"></a>

### web-adjustDisable-unsupported

| Code | Platform | Methods | Behavior | Startup state |
| --- | --- | --- | --- | --- |
| `UNIMPLEMENTED` | web | `adjustDisable` | `reject` | `either` |

Message (exact): `Not implemented on web.`

Cause: This API requires a supported native platform.

Fix: Gate the call by platform and use a supported iOS or Android implementation.

Source: [src/web.ts:188](../src/web.ts#L188).

<a id="web-adjustIsEnabled-unsupported"></a>

### web-adjustIsEnabled-unsupported

| Code | Platform | Methods | Behavior | Startup state |
| --- | --- | --- | --- | --- |
| `UNIMPLEMENTED` | web | `adjustIsEnabled` | `reject` | `either` |

Message (exact): `Not implemented on web.`

Cause: This API requires a supported native platform.

Fix: Gate the call by platform and use a supported iOS or Android implementation.

Source: [src/web.ts:196](../src/web.ts#L196).

<a id="web-adjustSwitchToOfflineMode-unsupported"></a>

### web-adjustSwitchToOfflineMode-unsupported

| Code | Platform | Methods | Behavior | Startup state |
| --- | --- | --- | --- | --- |
| `UNIMPLEMENTED` | web | `adjustSwitchToOfflineMode` | `reject` | `either` |

Message (exact): `Not implemented on web.`

Cause: This API requires a supported native platform.

Fix: Gate the call by platform and use a supported iOS or Android implementation.

Source: [src/web.ts:204](../src/web.ts#L204).

<a id="web-adjustSwitchBackToOnlineMode-unsupported"></a>

### web-adjustSwitchBackToOnlineMode-unsupported

| Code | Platform | Methods | Behavior | Startup state |
| --- | --- | --- | --- | --- |
| `UNIMPLEMENTED` | web | `adjustSwitchBackToOnlineMode` | `reject` | `either` |

Message (exact): `Not implemented on web.`

Cause: This API requires a supported native platform.

Fix: Gate the call by platform and use a supported iOS or Android implementation.

Source: [src/web.ts:212](../src/web.ts#L212).

<a id="web-adjustAddGlobalCallbackParameter-unsupported"></a>

### web-adjustAddGlobalCallbackParameter-unsupported

| Code | Platform | Methods | Behavior | Startup state |
| --- | --- | --- | --- | --- |
| `UNIMPLEMENTED` | web | `adjustAddGlobalCallbackParameter` | `reject` | `either` |

Message (exact): `Not implemented on web.`

Cause: This API requires a supported native platform.

Fix: Gate the call by platform and use a supported iOS or Android implementation.

Source: [src/web.ts:220](../src/web.ts#L220).

<a id="web-adjustAddGlobalPartnerParameter-unsupported"></a>

### web-adjustAddGlobalPartnerParameter-unsupported

| Code | Platform | Methods | Behavior | Startup state |
| --- | --- | --- | --- | --- |
| `UNIMPLEMENTED` | web | `adjustAddGlobalPartnerParameter` | `reject` | `either` |

Message (exact): `Not implemented on web.`

Cause: This API requires a supported native platform.

Fix: Gate the call by platform and use a supported iOS or Android implementation.

Source: [src/web.ts:228](../src/web.ts#L228).

<a id="web-adjustRemoveGlobalCallbackParameter-unsupported"></a>

### web-adjustRemoveGlobalCallbackParameter-unsupported

| Code | Platform | Methods | Behavior | Startup state |
| --- | --- | --- | --- | --- |
| `UNIMPLEMENTED` | web | `adjustRemoveGlobalCallbackParameter` | `reject` | `either` |

Message (exact): `Not implemented on web.`

Cause: This API requires a supported native platform.

Fix: Gate the call by platform and use a supported iOS or Android implementation.

Source: [src/web.ts:238](../src/web.ts#L238).

<a id="web-adjustRemoveGlobalPartnerParameter-unsupported"></a>

### web-adjustRemoveGlobalPartnerParameter-unsupported

| Code | Platform | Methods | Behavior | Startup state |
| --- | --- | --- | --- | --- |
| `UNIMPLEMENTED` | web | `adjustRemoveGlobalPartnerParameter` | `reject` | `either` |

Message (exact): `Not implemented on web.`

Cause: This API requires a supported native platform.

Fix: Gate the call by platform and use a supported iOS or Android implementation.

Source: [src/web.ts:248](../src/web.ts#L248).

<a id="web-adjustRemoveGlobalCallbackParameters-unsupported"></a>

### web-adjustRemoveGlobalCallbackParameters-unsupported

| Code | Platform | Methods | Behavior | Startup state |
| --- | --- | --- | --- | --- |
| `UNIMPLEMENTED` | web | `adjustRemoveGlobalCallbackParameters` | `reject` | `either` |

Message (exact): `Not implemented on web.`

Cause: This API requires a supported native platform.

Fix: Gate the call by platform and use a supported iOS or Android implementation.

Source: [src/web.ts:256](../src/web.ts#L256).

<a id="web-adjustRemoveGlobalPartnerParameters-unsupported"></a>

### web-adjustRemoveGlobalPartnerParameters-unsupported

| Code | Platform | Methods | Behavior | Startup state |
| --- | --- | --- | --- | --- |
| `UNIMPLEMENTED` | web | `adjustRemoveGlobalPartnerParameters` | `reject` | `either` |

Message (exact): `Not implemented on web.`

Cause: This API requires a supported native platform.

Fix: Gate the call by platform and use a supported iOS or Android implementation.

Source: [src/web.ts:264](../src/web.ts#L264).

<a id="web-adjustGetSdkVersion-unsupported"></a>

### web-adjustGetSdkVersion-unsupported

| Code | Platform | Methods | Behavior | Startup state |
| --- | --- | --- | --- | --- |
| `UNIMPLEMENTED` | web | `adjustGetSdkVersion` | `reject` | `either` |

Message (exact): `Not implemented on web.`

Cause: This API requires a supported native platform.

Fix: Gate the call by platform and use a supported iOS or Android implementation.

Source: [src/web.ts:272](../src/web.ts#L272).

<a id="web-adjustVerifyAppStorePurchase-unsupported"></a>

### web-adjustVerifyAppStorePurchase-unsupported

| Code | Platform | Methods | Behavior | Startup state |
| --- | --- | --- | --- | --- |
| `UNIMPLEMENTED` | web | `adjustVerifyAppStorePurchase` | `reject` | `either` |

Message (exact): `Not implemented on web.`

Cause: This API requires a supported native platform.

Fix: Gate the call by platform and use a supported iOS or Android implementation.

Source: [src/web.ts:282](../src/web.ts#L282).

<a id="web-adjustTrackAppStoreSubscription-unsupported"></a>

### web-adjustTrackAppStoreSubscription-unsupported

| Code | Platform | Methods | Behavior | Startup state |
| --- | --- | --- | --- | --- |
| `UNIMPLEMENTED` | web | `adjustTrackAppStoreSubscription` | `reject` | `either` |

Message (exact): `Not implemented on web.`

Cause: This API requires a supported native platform.

Fix: Gate the call by platform and use a supported iOS or Android implementation.

Source: [src/web.ts:292](../src/web.ts#L292).

<a id="web-adjustConvert-unsupported"></a>

### web-adjustConvert-unsupported

| Code | Platform | Methods | Behavior | Startup state |
| --- | --- | --- | --- | --- |
| `UNIMPLEMENTED` | web | `adjustConvert` | `reject` | `either` |

Message (exact): `Not implemented on web.`

Cause: This API requires a supported native platform.

Fix: Gate the call by platform and use a supported iOS or Android implementation.

Source: [src/web.ts:300](../src/web.ts#L300).

<a id="web-adjustRequestAppTrackingAuthorization-unsupported"></a>

### web-adjustRequestAppTrackingAuthorization-unsupported

| Code | Platform | Methods | Behavior | Startup state |
| --- | --- | --- | --- | --- |
| `UNIMPLEMENTED` | web | `adjustRequestAppTrackingAuthorization` | `reject` | `either` |

Message (exact): `Not implemented on web.`

Cause: This API requires a supported native platform.

Fix: Gate the call by platform and use a supported iOS or Android implementation.

Source: [src/web.ts:308](../src/web.ts#L308).

<a id="web-adjustAppTrackingAuthorizationStatus-unsupported"></a>

### web-adjustAppTrackingAuthorizationStatus-unsupported

| Code | Platform | Methods | Behavior | Startup state |
| --- | --- | --- | --- | --- |
| `UNIMPLEMENTED` | web | `adjustAppTrackingAuthorizationStatus` | `reject` | `either` |

Message (exact): `Not implemented on web.`

Cause: This API requires a supported native platform.

Fix: Gate the call by platform and use a supported iOS or Android implementation.

Source: [src/web.ts:316](../src/web.ts#L316).

<a id="web-adjustUpdateSkanConversionValue-unsupported"></a>

### web-adjustUpdateSkanConversionValue-unsupported

| Code | Platform | Methods | Behavior | Startup state |
| --- | --- | --- | --- | --- |
| `UNIMPLEMENTED` | web | `adjustUpdateSkanConversionValue` | `reject` | `either` |

Message (exact): `Not implemented on web.`

Cause: This API requires a supported native platform.

Fix: Gate the call by platform and use a supported iOS or Android implementation.

Source: [src/web.ts:324](../src/web.ts#L324).

<a id="web-adjustTrackPlayStoreSubscription-unsupported"></a>

### web-adjustTrackPlayStoreSubscription-unsupported

| Code | Platform | Methods | Behavior | Startup state |
| --- | --- | --- | --- | --- |
| `UNIMPLEMENTED` | web | `adjustTrackPlayStoreSubscription` | `reject` | `either` |

Message (exact): `Not implemented on web.`

Cause: This API requires a supported native platform.

Fix: Gate the call by platform and use a supported iOS or Android implementation.

Source: [src/web.ts:334](../src/web.ts#L334).

<a id="web-adjustVerifyPlayStorePurchase-unsupported"></a>

### web-adjustVerifyPlayStorePurchase-unsupported

| Code | Platform | Methods | Behavior | Startup state |
| --- | --- | --- | --- | --- |
| `UNIMPLEMENTED` | web | `adjustVerifyPlayStorePurchase` | `reject` | `either` |

Message (exact): `Not implemented on web.`

Cause: This API requires a supported native platform.

Fix: Gate the call by platform and use a supported iOS or Android implementation.

Source: [src/web.ts:344](../src/web.ts#L344).

<a id="web-adjustVerifyAndTrackPlayStorePurchase-unsupported"></a>

### web-adjustVerifyAndTrackPlayStorePurchase-unsupported

| Code | Platform | Methods | Behavior | Startup state |
| --- | --- | --- | --- | --- |
| `UNIMPLEMENTED` | web | `adjustVerifyAndTrackPlayStorePurchase` | `reject` | `either` |

Message (exact): `Not implemented on web.`

Cause: This API requires a supported native platform.

Fix: Gate the call by platform and use a supported iOS or Android implementation.

Source: [src/web.ts:352](../src/web.ts#L352).

<a id="web-adjustGetGoogleAdId-unsupported"></a>

### web-adjustGetGoogleAdId-unsupported

| Code | Platform | Methods | Behavior | Startup state |
| --- | --- | --- | --- | --- |
| `UNIMPLEMENTED` | web | `adjustGetGoogleAdId` | `reject` | `either` |

Message (exact): `Not implemented on web.`

Cause: This API requires a supported native platform.

Fix: Gate the call by platform and use a supported iOS or Android implementation.

Source: [src/web.ts:360](../src/web.ts#L360).

<a id="web-adjustGetAmazonAdId-unsupported"></a>

### web-adjustGetAmazonAdId-unsupported

| Code | Platform | Methods | Behavior | Startup state |
| --- | --- | --- | --- | --- |
| `UNIMPLEMENTED` | web | `adjustGetAmazonAdId` | `reject` | `either` |

Message (exact): `Not implemented on web.`

Cause: This API requires a supported native platform.

Fix: Gate the call by platform and use a supported iOS or Android implementation.

Source: [src/web.ts:368](../src/web.ts#L368).

<a id="web-adjustGetGooglePlayInstallReferrer-unsupported"></a>

### web-adjustGetGooglePlayInstallReferrer-unsupported

| Code | Platform | Methods | Behavior | Startup state |
| --- | --- | --- | --- | --- |
| `UNIMPLEMENTED` | web | `adjustGetGooglePlayInstallReferrer` | `reject` | `either` |

Message (exact): `Not implemented on web.`

Cause: This API requires a supported native platform.

Fix: Gate the call by platform and use a supported iOS or Android implementation.

Source: [src/web.ts:376](../src/web.ts#L376).

<a id="web-adjustSetReferrer-unsupported"></a>

### web-adjustSetReferrer-unsupported

| Code | Platform | Methods | Behavior | Startup state |
| --- | --- | --- | --- | --- |
| `UNIMPLEMENTED` | web | `adjustSetReferrer` | `reject` | `either` |

Message (exact): `Not implemented on web.`

Cause: This API requires a supported native platform.

Fix: Gate the call by platform and use a supported iOS or Android implementation.

Source: [src/web.ts:384](../src/web.ts#L384).

## Limits and uncoded notifications

Dynamic iOS `error.localizedDescription`, Android exception messages and backend messages have no fixed text enumerable from this wrapper. They are marked explicitly rather than replaced with invented messages. Treat them as potentially sensitive; do not log credentials or link, event, purchase, push or referrer payloads.

`didFailResolvingURL` is a listener notification, not a promise rejection or a resolved link-data error: iOS forwards `error.localizedDescription` at [TappAdjustPlugin.swift:161](../ios/Sources/TappAdjustCapacitorPlugin/TappAdjustPlugin.swift#L161), and Android forwards `response.error` at [TappAdjustPlugin.kt:46](../android/src/main/java/so/tapp/capacitor/adjust/TappAdjustPlugin.kt#L46). It has no bridge error code. Android deferred-link notifications reuse `linkData` mapping, so its null/error-response rows also describe those mapped payloads.

Android coroutine cancellation is rethrown internally at [TappAdjustPlugin.kt:104](../android/src/main/java/so/tapp/capacitor/adjust/TappAdjustPlugin.kt#L104) and [TappAdjustPlugin.kt:156](../android/src/main/java/so/tapp/capacitor/adjust/TappAdjustPlugin.kt#L156); the plugin does not translate it into a bridge error. Android lifecycle exceptions are swallowed. These paths have no cataloged rejection code or guaranteed promise settlement.

Missing optional identifiers, attribution or converted URL fields can resolve as omitted fields or empty objects; they do not automatically reject `UNAVAILABLE`. Android install-referrer callbacks with null details resolve an empty object. Purchase verification is the explicitly rejected missing-result case described above.

Native callbacks may never fire. In particular, the Android adapter can swallow exceptions or return without invoking a callback; the wrapper adds no timeout. A pending promise is not an additional error code. This catalog is a static source audit, not device or live SDK validation. iOS builds and physical-device tests remain unverified as recorded in [Known limitations](../README.md#known-limitations).

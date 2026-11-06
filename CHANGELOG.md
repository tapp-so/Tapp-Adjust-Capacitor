# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.0-alpha.0]

### Added

- Initial release of the `tapp-adjust-capacitor-sdk` Capacitor plugin, a superset of `tapp-capacitor-sdk`: every core method, event, type, and error semantic is unchanged.
- Core TypeScript API: `start`, `url`, `handleTappEvent`, `shouldProcess`, `fetchLinkData`, `fetchOriginLinkData`, and the events `deferredLinkReceived` and `didFailResolvingURL` (retained until the first listener attaches). `start` selects the Adjust affiliate natively; there is no affiliate option and no Adjust app token in JavaScript.
- Adjust API on iOS and Android: `handleEvent`, `getAdjustAttribution`, `adjustGetAdid`, `adjustGetIdfa`, `adjustTrackAdRevenue`, `adjustSetPushToken`, `adjustGdprForgetMe`, `adjustTrackThirdPartySharing`, `adjustTrackMeasurementConsent`, `adjustEnable`, `adjustDisable`, `adjustIsEnabled`, `adjustSwitchToOfflineMode`, `adjustSwitchBackToOnlineMode`, `adjustAddGlobalCallbackParameter`, `adjustAddGlobalPartnerParameter`, `adjustRemoveGlobalCallbackParameter`, `adjustRemoveGlobalPartnerParameter`, `adjustRemoveGlobalCallbackParameters`, `adjustRemoveGlobalPartnerParameters`, and `adjustGetSdkVersion`.
- iOS-only Adjust API: `adjustVerifyAppStorePurchase`, `adjustTrackAppStoreSubscription` (price, currency, and transactionId only), `adjustConvert`, `adjustRequestAppTrackingAuthorization`, `adjustAppTrackingAuthorizationStatus` (a promise), and `adjustUpdateSkanConversionValue`.
- Android-only Adjust API: `adjustTrackPlayStoreSubscription`, `adjustVerifyPlayStorePurchase`, `adjustVerifyAndTrackPlayStorePurchase`, `adjustGetGoogleAdId`, `adjustGetAmazonAdId`, `adjustGetGooglePlayInstallReferrer` (typed subset: `installReferrer`, `referrerClickTimestampSeconds`, `installBeginTimestampSeconds`), and `adjustSetReferrer`.
- Result types `AdjustAttribution`, `AdjustInstallReferrer`, and `VerifyResult`, and one options type per method. Optional result fields are omitted when the native SDK returns no value.
- Error handling: every Adjust method and `handleEvent` rejects `NOT_STARTED` before `start()`; a method the platform does not implement (and every method on web) rejects `UNIMPLEMENTED` instead of staying pending; invalid input rejects `INVALID_ARGUMENT`. Further codes: `INVALID_URL` (`adjustConvert`), `SKAN_ERROR`, `INSTALL_REFERRER_ERROR`, `HANDLE_EVENT_ERROR`, and `UNAVAILABLE`.
- Global callback and partner parameters map `{ key, value }` to each platform's native argument order (iOS takes the value first).
- `adjustVerifyPlayStorePurchase` maps `transactionId` (the Play purchase token) and `productId` to the native purchase object in the correct order.
- Android lifecycle: `adjustOnResume` and `adjustOnPause` are forwarded natively from the plugin's resume and pause callbacks after a successful `start()`, including one call for an Activity that is already resumed when `start()` finishes. `handleOnNewIntent` is not hooked. There are no public `adjustOnResume` or `adjustOnPause` methods.
- iOS Swift bridge (`CAPBridgedPlugin`), distributed through Swift Package Manager and CocoaPods. The Android Kotlin bridge uses the package `so.tapp.capacitor.adjust`. Both register the plugin under the JavaScript name `Tapp`.
- Pinned native SDK versions:
  - iOS `Tapp` `1.1.23`
  - iOS `Tapp-Adjust` `1.1.26`
  - iOS `Tapp-Networking` `1.1.7`
  - iOS Adjust `ios_sdk` `5.0.1` (transitive through `Tapp-Adjust-iOS` with Swift Package Manager; the `Adjust` pod is not pinned with CocoaPods)
  - Android `com.github.tapp-so.Tapp-Android:Tapp-Adjust` `1.1.6` (transitive: `Tapp-Core` `1.1.6`, `adjust-android` and `adjust-android-webbridge` `5.0.0`, `adjust-android-signature` `strictly 3.47.0`, `installreferrer` `2.2`)
- Requirements: iOS 15.0, Android minSdk 24, Capacitor 6, 7, and 8 (peer `@capacitor/core` `>=6.0.0 <9.0.0`).
  - Capacitor 6 and 7 apps must raise their iOS deployment target and Android `minSdkVersion` to the minimums above.
- Mutual exclusion with `tapp-capacitor-sdk`: on Android, the build fails with `Install exactly one of tapp-capacitor-sdk or tapp-adjust-capacitor-sdk.` when both plugins are installed. iOS has no compile-time guard, and co-installing is unsupported.
- Plugin privacy manifest (`PrivacyInfo.xcprivacy`), identical to the core plugin's baseline: Device ID, Product Interaction, and Other Data Types, none linked to the user or used for tracking.
- Web stub: validates `start` input, reports that Tapp is not supported on web, and rejects with `INVALID_ARGUMENT`, `INVALID_URL`, and `UNIMPLEMENTED`.
- Shared URL validation for `shouldProcess` and `fetchLinkData` on web, iOS, and Android: the URL is trimmed and must be an absolute URL with a scheme. `javascript:`, `data:`, and `file:` are rejected (case-insensitive) with `INVALID_URL`.
- Example app (`example-app/`) with the core demo and an Adjust section, including iOS-only and Android-only blocks that show "unsupported on this platform" for `UNIMPLEMENTED`, plus a JitPack sync hook.
- CI: JavaScript checks, Android unit tests and release build, Android host builds for Capacitor 6, 7, and 8, an iOS test and build job, a JS/types check against the Capacitor peer range, and an `exclusive-install` job that installs both plugins and expects the Android build to fail with the guard message.

### Known limitations

- Link handling is JavaScript-side only. With the Adjust affiliate, `shouldProcess` is `true` for URLs that have an `adj_t` parameter, which differs from the core plugin.
- The web platform is not supported.
- Device-level end-to-end tests are pending: deferred links, Universal Links and App Links, cold and warm start, Adjust session tracking and the Android first-resume forwarding, ATT, SKAN, and purchase verification.
- The iOS bridge has not been compiled: it was written on a Linux machine without the iOS SDK. The Swift files were only syntax-parsed, and the mapping unit tests ran on Linux. An Xcode build, including whether `Tapp`, `TappNetworking`, and `TappAdjust` can be imported together, is pending.
- Android native callbacks may never fire if the Adjust service is missing or the Adjust SDK throws locally, because the native `Tapp-Adjust` adapter swallows the exception. This is native behavior; the plugin adds no timeout.
- The `Adjust` pod is not pinned with CocoaPods, and `adjust-android-signature` is pinned `strictly 3.47.0`, which can conflict with host apps that depend on another version.
- The iOS `adjust_signature_sdk` version is not pinned by this plugin. A fresh SPM resolve on 2026-11-06 picked 3.67.0, while Android uses `strictly 3.47.0`, so the platforms may run different signature SDK versions.
- Manifest entries contributed by the Adjust AARs on Android have not been inspected, and a minified release build with Adjust has not been tested.

### Open questions

- Whether the Adjust APIs (`adjustGetIdfa`, App Tracking Transparency, SKAdNetwork, third-party sharing, and global partner parameters) require `NSPrivacyTracking` or tracking-domain changes in the privacy manifest. The baseline manifest is shipped unchanged and the question is **open**.

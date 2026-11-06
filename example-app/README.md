# Tapp Adjust Capacitor Example

Plain Vite + TypeScript app using the local `tapp-adjust-capacitor-sdk` package.
Use Node.js 22.12+ and the native tooling for your chosen platform.

From the repository root:

```sh
npm install
npm run build
cd example-app
npm install
npm run build
npx cap add ios
npx cap add android
npx cap sync
npx cap open ios
npx cap open android
```

Add/open only the platforms you need; iOS requires macOS and Xcode. SPM is the
default for new Capacitor 8 iOS projects. Minimum versions: **iOS 15.0** and
**Android minSdk 24** (`android/variables.gradle`). Generated `ios/` and `android/`
projects, dependencies, and `dist/` are git-ignored. After web changes, run
`npm run build` and `npm run cap:sync`. `npm run dev` previews the UI in a browser;
native SDK features require an iOS or Android device/emulator.

Enter your own authToken and tappToken, keep SANDBOX selected for testing, and
press Start. Credentials are held only in memory for the current session and
passed to the SDK at startup; no real tokens belong in source control. Generate
a URL, send a custom/standard event, or inspect link data in the log. Event
metadata includes an intentionally invalid nested value that the SDK drops.

The app starts once, then attaches `deferredLinkReceived` and
`didFailResolvingURL` listeners to demonstrate retained events. After startup,
`App.getLaunchUrl()` handles cold starts and `App.addListener('appUrlOpen', …)`
handles warm starts. Both call `shouldProcess` before `fetchLinkData` in JS.
No Tapp-specific AppDelegate or Activity hooks are needed. Link resolution can
return `{ error: true, message }`; check the log even when a promise resolves.

## Adjust demo

After Start, the **Adjust** section calls the plugin's Adjust methods: `handleEvent`
(enter an Adjust event token), `getAdjustAttribution`, `adjustGetAdid`,
`adjustEnable` / `adjustDisable` / `adjustIsEnabled`, offline and online mode, adding
and removing global callback and partner parameters, and `adjustGetSdkVersion`.

Two more blocks hold platform-specific calls:

- **iOS-only:** App Tracking Transparency request and status, SKAN conversion value update,
  and `adjustConvert`.
- **Android-only:** Google Play install referrer, Google Ad ID, Amazon Ad ID, and Play Store
  purchase verification (the purchase token is passed as `transactionId`).

Every button calls the plugin on every platform and shows the outcome under the Adjust
heading and in the log. A method the current platform does not implement rejects with
`UNIMPLEMENTED`, which the app shows as "unsupported on this platform". Adjust methods
reject with `NOT_STARTED` until Start has completed. Event, purchase, and push tokens you
enter are sent to the SDK but never displayed or logged, and the attribution tracker token is
hidden in the output. Credentials and tokens are held only in memory.

### App Tracking Transparency (iOS)

The ATT buttons need a usage description in the generated iOS app. After `npx cap add ios`,
add this to `ios/App/App/Info.plist` with text that explains your real use:

```xml
<key>NSUserTrackingUsageDescription</key>
<string>This identifier is used to measure and attribute app installs.</string>
```

Add this key before you call `adjustRequestAppTrackingAuthorization()` or
`adjustAppTrackingAuthorizationStatus()`. Run `npx cap sync` after changing the file.
Neither the prompt nor its result has been verified on a device.

For real links, configure your Tapp domain in the dashboard and the host app:

- **iOS:** enable Associated Domains in Signing & Capabilities and add
  `applinks:YOUR_TAPP_DOMAIN`. Ensure the domain's AASA configuration matches your
  Apple team ID and app bundle ID (`so.tapp.capacitor.adjust.example`).
- **Android:** inside `MainActivity` in `android/app/src/main/AndroidManifest.xml`,
  add this App Links filter, replacing the domain. Configure the domain's
  `assetlinks.json` with the application ID and **SHA-256 signing certificate hash**
  for the build installed on your device.

```xml
<intent-filter android:autoVerify="true">
    <action android:name="android.intent.action.VIEW" />
    <category android:name="android.intent.category.DEFAULT" />
    <category android:name="android.intent.category.BROWSABLE" />
    <data android:scheme="https" android:host="YOUR_TAPP_DOMAIN" />
</intent-filter>
```

The `capacitor:sync:after` app hook runs `scripts/ensure-jitpack.mjs` during sync.
It adds `maven { url 'https://jitpack.io' }` inside the app's
`android/build.gradle` → `allprojects.repositories`, after `mavenCentral()` when
available. It is safe to run repeatedly, warns if the file/block is missing,
and warns without modifying `minSdkVersion` when it is below 24. Run it manually
from this directory with `node scripts/ensure-jitpack.mjs` if needed.

import type { PluginListenerHandle } from '@capacitor/core';

/**
 * SDK environment.
 * @since 0.1.0
 */
export type TappEnvironment = 'PRODUCTION' | 'SANDBOX';

/**
 * Credentials and environment used to initialize Tapp.
 * @since 0.1.0
 */
export interface TappStartOptions {
  /**
   * Authentication token.
   * @since 0.1.0
   */
  authToken: string;
  /**
   * SDK environment.
   * @since 0.1.0
   */
  env: TappEnvironment;
  /**
   * Tapp application token.
   * @since 0.1.0
   */
  tappToken: string;
}

/**
 * Resolved link data. fetchLinkData rejects with INVALID_URL for an invalid URL
 * (checked before anything else, so also before start()). Otherwise link-data calls
 * resolve; failures and calls made before start() resolve with { error: true, message }.
 * Optional fields are omitted when unavailable.
 * @since 0.1.0
 */
export interface TappLinkData {
  /**
   * Whether link resolution failed.
   * @since 0.1.0
   */
  error: boolean;
  /**
   * Failure description, when available.
   * @since 0.1.0
   */
  message?: string;
  /**
   * Resolved Tapp URL.
   * @since 0.1.0
   */
  tappUrl?: string;
  /**
   * Attribution Tapp URL.
   * @since 0.1.0
   */
  attrTappUrl?: string;
  /**
   * Influencer associated with the link.
   * @since 0.1.0
   */
  influencer?: string;
  /**
   * Custom string data associated with the link.
   * @since 0.1.0
   */
  data?: Record<string, string>;
  /**
   * Whether this is the first session.
   * @since 0.1.0
   */
  isFirstSession?: boolean;
  /**
   * Original deep link, when available; omitted on iOS.
   * @since 0.1.0
   */
  deepLink?: string;
}

/**
 * URL resolution failure event payload.
 * @since 0.1.0
 */
export interface TappResolveFailure {
  /**
   * URL that could not be resolved.
   * @since 0.1.0
   */
  url: string;
  /**
   * Resolution error description.
   * @since 0.1.0
   */
  error: string;
}

/**
 * Flat event metadata. Only strings, finite numbers, and booleans are kept;
 * invalid values are dropped without throwing.
 * @since 0.1.0
 */
export type TappMetadata = Record<string, string | number | boolean>;

/**
 * Event identifiers shared with the native SDKs.
 * @since 0.1.0
 */
export enum EventAction {
  /**
   * Add payment info event.
   * @since 0.1.0
   */
  TAPP_ADD_PAYMENT_INFO = 1,
  /**
   * Add to cart event.
   * @since 0.1.0
   */
  TAPP_ADD_TO_CART = 2,
  /**
   * Add to wishlist event.
   * @since 0.1.0
   */
  TAPP_ADD_TO_WISHLIST = 3,
  /**
   * Complete registration event.
   * @since 0.1.0
   */
  TAPP_COMPLETE_REGISTRATION = 4,
  /**
   * Contact event.
   * @since 0.1.0
   */
  TAPP_CONTACT = 5,
  /**
   * Customize product event.
   * @since 0.1.0
   */
  TAPP_CUSTOMIZE_PRODUCT = 6,
  /**
   * Donate event.
   * @since 0.1.0
   */
  TAPP_DONATE = 7,
  /**
   * Find location event.
   * @since 0.1.0
   */
  TAPP_FIND_LOCATION = 8,
  /**
   * Initiate checkout event.
   * @since 0.1.0
   */
  TAPP_INITIATE_CHECKOUT = 9,
  /**
   * Generate lead event.
   * @since 0.1.0
   */
  TAPP_GENERATE_LEAD = 10,
  /**
   * Purchase event.
   * @since 0.1.0
   */
  TAPP_PURCHASE = 11,
  /**
   * Schedule event.
   * @since 0.1.0
   */
  TAPP_SCHEDULE = 12,
  /**
   * Search event.
   * @since 0.1.0
   */
  TAPP_SEARCH = 13,
  /**
   * Start trial event.
   * @since 0.1.0
   */
  TAPP_START_TRIAL = 14,
  /**
   * Submit application event.
   * @since 0.1.0
   */
  TAPP_SUBMIT_APPLICATION = 15,
  /**
   * Subscribe event.
   * @since 0.1.0
   */
  TAPP_SUBSCRIBE = 16,
  /**
   * View content event.
   * @since 0.1.0
   */
  TAPP_VIEW_CONTENT = 17,
  /**
   * Click button event.
   * @since 0.1.0
   */
  TAPP_CLICK_BUTTON = 18,
  /**
   * Download file event.
   * @since 0.1.0
   */
  TAPP_DOWNLOAD_FILE = 19,
  /**
   * Join group event.
   * @since 0.1.0
   */
  TAPP_JOIN_GROUP = 20,
  /**
   * Achieve level event.
   * @since 0.1.0
   */
  TAPP_ACHIEVE_LEVEL = 21,
  /**
   * Create group event.
   * @since 0.1.0
   */
  TAPP_CREATE_GROUP = 22,
  /**
   * Create role event.
   * @since 0.1.0
   */
  TAPP_CREATE_ROLE = 23,
  /**
   * Link click event.
   * @since 0.1.0
   */
  TAPP_LINK_CLICK = 24,
  /**
   * Link impression event.
   * @since 0.1.0
   */
  TAPP_LINK_IMPRESSION = 25,
  /**
   * Apply for loan event.
   * @since 0.1.0
   */
  TAPP_APPLY_FOR_LOAN = 26,
  /**
   * Loan approval event.
   * @since 0.1.0
   */
  TAPP_LOAN_APPROVAL = 27,
  /**
   * Loan disbursal event.
   * @since 0.1.0
   */
  TAPP_LOAN_DISBURSAL = 28,
  /**
   * Login event.
   * @since 0.1.0
   */
  TAPP_LOGIN = 29,
  /**
   * Rate event.
   * @since 0.1.0
   */
  TAPP_RATE = 30,
  /**
   * Spend credits event.
   * @since 0.1.0
   */
  TAPP_SPEND_CREDITS = 31,
  /**
   * Unlock achievement event.
   * @since 0.1.0
   */
  TAPP_UNLOCK_ACHIEVEMENT = 32,
  /**
   * Add shipping info event.
   * @since 0.1.0
   */
  TAPP_ADD_SHIPPING_INFO = 33,
  /**
   * Earn virtual currency event.
   * @since 0.1.0
   */
  TAPP_EARN_VIRTUAL_CURRENCY = 34,
  /**
   * Start level event.
   * @since 0.1.0
   */
  TAPP_START_LEVEL = 35,
  /**
   * Complete level event.
   * @since 0.1.0
   */
  TAPP_COMPLETE_LEVEL = 36,
  /**
   * Post score event.
   * @since 0.1.0
   */
  TAPP_POST_SCORE = 37,
  /**
   * Select content event.
   * @since 0.1.0
   */
  TAPP_SELECT_CONTENT = 38,
  /**
   * Begin tutorial event.
   * @since 0.1.0
   */
  TAPP_BEGIN_TUTORIAL = 39,
  /**
   * Complete tutorial event.
   * @since 0.1.0
   */
  TAPP_COMPLETE_TUTORIAL = 40,
  /**
   * Custom event.
   * @since 0.1.0
   */
  CUSTOM = 0,
}

/**
 * Options for generating a Tapp link.
 * @since 0.1.0
 */
export interface TappUrlOptions {
  /**
   * Influencer identifier.
   * @since 0.1.0
   */
  influencer: string;
  /**
   * Advertising group.
   * @since 0.1.0
   */
  adGroup?: string;
  /**
   * Creative identifier.
   * @since 0.1.0
   */
  creative?: string;
  /**
   * Custom string data to attach to the link.
   * @since 0.1.0
   */
  data?: Record<string, string>;
}

/**
 * Options for sending a Tapp event.
 * @since 0.1.0
 */
export interface TappEventOptions {
  /**
   * Standard event identifier or CUSTOM.
   * @since 0.1.0
   */
  eventAction: EventAction;
  /**
   * Custom event name used with CUSTOM. Missing, empty, or whitespace-only names
   * fall back to "custom_event_autogenerated"; other names are preserved.
   * @since 0.1.0
   */
  customValue?: string;
  /**
   * Flat metadata; invalid value types are dropped without throwing.
   * @since 0.1.0
   */
  metadata?: TappMetadata;
}

/**
 * Tapp native plugin API. Invalid input rejects with INVALID_ARGUMENT for
 * start(), url(), and handleTappEvent(), or INVALID_URL for shouldProcess()
 * and fetchLinkData(). Startup requirements and SDK failures follow the
 * method-specific behavior below. Web support is documented per method.
 * @since 0.1.0
 */
export interface TappPlugin {
  /**
   * Initialize the SDK with nonempty tokens and env PRODUCTION or SANDBOX.
   * Invalid input rejects with INVALID_ARGUMENT. Web and Android also reject
   * whitespace-only tokens; iOS rejects only empty strings. Android may reject SDK
   * initialization with START_ERROR. After a successful native start, later calls
   * resolve without validation. On web, every call validates input; the warning is
   * logged once.
   * Register deferred-link and failure listeners before calling start().
   * Load authToken, env, and tappToken from app configuration; never log credentials.
   * Configure the Adjust app token in the Tapp dashboard, not in JavaScript.
   * @platform iOS, Android; web validates options without starting a native SDK.
   * @throws Rejects with INVALID_ARGUMENT for invalid credentials or environment.
   * @throws Rejects with START_ERROR if Android native initialization fails.
   * @example
   * await Tapp.start({ authToken, env, tappToken });
   * @since 0.1.0
   */
  start(options: TappStartOptions): Promise<void>;
  /**
   * Generate a Tapp link. Rejects with NOT_STARTED before start(), INVALID_ARGUMENT
   * for a missing or empty influencer (also whitespace-only on Android), or URL_ERROR
   * when link generation fails. On web, rejects with UNIMPLEMENTED.
   * Call start() first and await its successful completion.
   * @platform iOS, Android; web behavior is described above.
   * @throws Rejects with NOT_STARTED before native startup.
   * @throws Rejects with INVALID_ARGUMENT for invalid options as described above.
   * @throws Rejects with UNIMPLEMENTED on web.
   * @throws Rejects with URL_ERROR if link generation fails.
   * @example
   * await Tapp.url({ influencer });
   * @since 0.1.0
   */
  url(options: TappUrlOptions): Promise<{ url: string }>;
  /**
   * Send an event, dropping invalid metadata values. Rejects with NOT_STARTED before
   * start() or INVALID_ARGUMENT unless eventAction is an integer from 0 through 40.
   * Android may also reject with HANDLE_EVENT_ERROR if SDK event handling fails.
   * On web, rejects with UNIMPLEMENTED.
   * Call start() first and await its successful completion.
   * @platform iOS, Android; web behavior is described above.
   * @throws Rejects with NOT_STARTED before native startup.
   * @throws Rejects with INVALID_ARGUMENT for invalid options as described above.
   * @throws Rejects with UNIMPLEMENTED on web.
   * @throws Rejects with HANDLE_EVENT_ERROR if Android SDK event handling fails.
   * @example
   * await Tapp.handleTappEvent({ eventAction: EventAction.TAPP_ADD_TO_CART });
   * @since 0.1.0
   */
  handleTappEvent(options: TappEventOptions): Promise<void>;
  /**
   * Check whether Tapp can process a URL, including before start(). After trimming, the
   * blank, scheme-present, and blocked-scheme checks (javascript:, data:, file:,
   * case-insensitive) are the same on web, iOS, and Android. Platform URL parsers may
   * differ on edge cases such as 'https://x/a b', 'https://', and 'tapp:'.
   * Invalid URLs reject with INVALID_URL. On iOS,
   * resolves with the native result. On Android, resolves with { value: false } if the
   * native SDK throws. On web, a valid URL resolves with { value: false }.
   * Native eligibility uses the Adjust link rule with adj_t; use the native result.
   * @platform iOS, Android; web behavior is described above.
   * @throws Rejects with INVALID_URL for an invalid or blocked URL, before checking startup.
   * @example
   * const { value } = await Tapp.shouldProcess({ url: incomingUrl });
   * if (!value) return;
   * @since 0.1.0
   */
  shouldProcess(options: { url: string }): Promise<{ value: boolean }>;
  /**
   * Resolve link data for a URL. After trimming, the blank, scheme-present, and
   * blocked-scheme checks (javascript:, data:, file:, case-insensitive) are the same on
   * web, iOS, and Android. Platform URL parsers may differ on edge cases such as
   * 'https://x/a b', 'https://', and 'tapp:'. Invalid URLs reject with INVALID_URL
   * before start() is checked. Before start(),
   * a valid URL resolves with { error: true, message }. After start(), SDK/backend
   * failures resolve with { error: true, message }. On web, a valid URL resolves with
   * { error: true, message: 'Tapp is not supported on web.' }.
   * Call start() first and await its successful completion.
   * @platform iOS, Android; web behavior is described above.
   * @throws Rejects with INVALID_URL for an invalid or blocked URL, before checking startup.
   * Check data.error even when the promise resolves. iOS omits deepLink.
   * @returns Link data, or an error payload for startup, resolution, or web support failures.
   * @example
   * const data = await Tapp.fetchLinkData({ url: incomingUrl });
   * if (data.error) return;
   * // Route using the resolved data.
   * @since 0.1.0
   */
  fetchLinkData(options: { url: string }): Promise<TappLinkData>;
  /**
   * Resolve the original install link. Takes no URL, so no URL validation applies.
   * SDK/backend failures and calls before start() resolve with { error: true, message }.
   * On web, resolves with { error: true, message: 'Tapp is not supported on web.' }.
   * Call start() first and await its successful completion.
   * @platform iOS, Android; web behavior is described above.
   * Check data.error even when the promise resolves. iOS omits deepLink.
   * @returns Link data, or an error payload for startup, resolution, or web support failures.
   * @example
   * const data = await Tapp.fetchOriginLinkData();
   * if (data.error) return;
   * // Route using the resolved data.
   * @since 0.1.0
   */
  fetchOriginLinkData(): Promise<TappLinkData>;
  /**
   * Listen for a deferred link. Native events are retained until a listener attaches.
   * Register before start() to receive startup events.
   * @platform iOS, Android; web has no native Tapp events.
   * @example
   * const listener = await Tapp.addListener('deferredLinkReceived', (data) => {
   *   if (data.error) return;
   *   // Route using the resolved data.
   * });
   * await listener.remove();
   * @since 0.1.0
   */
  addListener(
    eventName: 'deferredLinkReceived',
    fn: (data: TappLinkData) => void,
  ): Promise<PluginListenerHandle>;
  /**
   * Listen for URL resolution failures.
   * Register before start() to receive startup events.
   * @platform iOS, Android; web has no native Tapp events.
   * @example
   * const listener = await Tapp.addListener('didFailResolvingURL', () => {
   *   // Show a generic link-resolution failure without logging payloads.
   * });
   * await listener.remove();
   * @since 0.1.0
   */
  addListener(
    eventName: 'didFailResolvingURL',
    fn: (failure: TappResolveFailure) => void,
  ): Promise<PluginListenerHandle>;
  /**
   * Remove all plugin event listeners.
   * Does not require start(). Removes both deferred-link and failure listeners.
   * @platform iOS, Android, web.
   * @example
   * await Tapp.removeAllListeners();
   * @since 0.1.0
   */
  removeAllListeners(): Promise<void>;
}

/**
 * Purchase verification result returned by the Adjust SDK.
 * @since 0.1.0
 */
export interface VerifyResult {
  /**
   * Verification status reported by Adjust.
   * @since 0.1.0
   */
  verificationStatus: string;
  /**
   * Verification status code reported by Adjust.
   * @since 0.1.0
   */
  code: number;
  /**
   * Verification message reported by Adjust.
   * @since 0.1.0
   */
  message: string;
}

/**
 * Adjust attribution. Every field is optional and omitted when the native SDK
 * does not provide a value.
 * @since 0.1.0
 */
export interface AdjustAttribution {
  /**
   * Tracker token.
   * @since 0.1.0
   */
  trackerToken?: string;
  /**
   * Tracker name.
   * @since 0.1.0
   */
  trackerName?: string;
  /**
   * Network name.
   * @since 0.1.0
   */
  network?: string;
  /**
   * Campaign name.
   * @since 0.1.0
   */
  campaign?: string;
  /**
   * Ad group name.
   * @since 0.1.0
   */
  adgroup?: string;
  /**
   * Creative name.
   * @since 0.1.0
   */
  creative?: string;
  /**
   * Click label.
   * @since 0.1.0
   */
  clickLabel?: string;
  /**
   * Cost type.
   * @since 0.1.0
   */
  costType?: string;
  /**
   * Cost amount.
   * @since 0.1.0
   */
  costAmount?: number;
  /**
   * Cost currency.
   * @since 0.1.0
   */
  costCurrency?: string;
  /**
   * Facebook install referrer. Android only.
   * @since 0.1.0
   */
  fbInstallReferrer?: string;
}

/**
 * Google Play install referrer details (typed subset). Every field is optional and
 * omitted when unavailable: installReferrer when null or blank, a timestamp when it
 * is 0 or less (0 is the Play default for an unavailable value).
 * @since 0.1.0
 */
export interface AdjustInstallReferrer {
  /**
   * Install referrer string.
   * @since 0.1.0
   */
  installReferrer?: string;
  /**
   * Client-side referrer click timestamp, in seconds.
   * @since 0.1.0
   */
  referrerClickTimestampSeconds?: number;
  /**
   * Client-side install begin timestamp, in seconds.
   * @since 0.1.0
   */
  installBeginTimestampSeconds?: number;
}

/**
 * Options for sending an Adjust event through Tapp.
 * @since 0.1.0
 */
export interface AdjustEventOptions {
  /**
   * Nonempty Adjust event token.
   * @since 0.1.0
   */
  eventToken: string;
}

/**
 * Options for tracking ad revenue.
 * @since 0.1.0
 */
export interface AdjustAdRevenueOptions {
  /**
   * Nonempty ad revenue source.
   * @since 0.1.0
   */
  source: string;
  /**
   * Finite, non-negative revenue amount.
   * @since 0.1.0
   */
  revenue: number;
  /**
   * Nonempty currency code.
   * @since 0.1.0
   */
  currency: string;
}

/**
 * Options for setting the push token.
 * @since 0.1.0
 */
export interface AdjustPushTokenOptions {
  /**
   * Nonempty push notification token.
   * @since 0.1.0
   */
  token: string;
}

/**
 * Options for third-party sharing.
 * @since 0.1.0
 */
export interface AdjustThirdPartySharingOptions {
  /**
   * Whether third-party sharing is enabled.
   * @since 0.1.0
   */
  enabled: boolean;
}

/**
 * Options for measurement consent.
 * @since 0.1.0
 */
export interface AdjustMeasurementConsentOptions {
  /**
   * Whether measurement consent is granted.
   * @since 0.1.0
   */
  consent: boolean;
}

/**
 * Options for adding a global callback or partner parameter.
 * @since 0.1.0
 */
export interface AdjustGlobalParameterOptions {
  /**
   * Nonempty parameter key.
   * @since 0.1.0
   */
  key: string;
  /**
   * Nonempty parameter value.
   * @since 0.1.0
   */
  value: string;
}

/**
 * Options for removing a global callback or partner parameter.
 * @since 0.1.0
 */
export interface AdjustGlobalParameterKeyOptions {
  /**
   * Nonempty parameter key.
   * @since 0.1.0
   */
  key: string;
}

/**
 * Options for verifying an App Store purchase.
 * @since 0.1.0
 */
export interface AdjustAppStorePurchaseOptions {
  /**
   * Nonempty App Store transaction identifier.
   * @since 0.1.0
   */
  transactionId: string;
  /**
   * Nonempty product identifier.
   * @since 0.1.0
   */
  productId: string;
}

/**
 * Options for tracking an App Store subscription.
 * @since 0.1.0
 */
export interface AdjustAppStoreSubscriptionOptions {
  /**
   * Finite subscription price.
   * @since 0.1.0
   */
  price: number;
  /**
   * Nonempty currency code.
   * @since 0.1.0
   */
  currency: string;
  /**
   * Nonempty App Store transaction identifier.
   * @since 0.1.0
   */
  transactionId: string;
}

/**
 * Options for converting a universal link.
 * @since 0.1.0
 */
export interface AdjustConvertOptions {
  /**
   * Universal link to convert.
   * @since 0.1.0
   */
  universalLink: string;
  /**
   * Nonempty target URL scheme.
   * @since 0.1.0
   */
  scheme: string;
}

/**
 * Options for updating the SKAdNetwork conversion value.
 * @since 0.1.0
 */
export interface AdjustSkanConversionValueOptions {
  /**
   * Integer conversion value.
   * @since 0.1.0
   */
  value: number;
  /**
   * Coarse conversion value.
   * @since 0.1.0
   */
  coarseValue?: string;
  /**
   * Lock window flag passed to the native SDK.
   * @since 0.1.0
   */
  lockWindow?: number;
}

/**
 * Options for tracking a Google Play subscription.
 * @since 0.1.0
 */
export interface AdjustPlayStoreSubscriptionOptions {
  /**
   * Subscription price in micro-units (for example 9.99 becomes 9990000), typically Google Play
   * Billing's `priceAmountMicros`. The value is converted to a native `Long`: fractional input is
   * truncated toward zero, not rounded or converted.
   * @since 0.1.0
   */
  price: number;
  /**
   * Nonempty currency code.
   * @since 0.1.0
   */
  currency: string;
  /**
   * Nonempty product SKU.
   * @since 0.1.0
   */
  sku: string;
  /**
   * Nonempty order identifier.
   * @since 0.1.0
   */
  orderId: string;
  /**
   * Nonempty purchase signature.
   * @since 0.1.0
   */
  signature: string;
  /**
   * Nonempty purchase token.
   * @since 0.1.0
   */
  purchaseToken: string;
  /**
   * Finite purchase time, passed to the native SDK as an integer.
   * @since 0.1.0
   */
  purchaseTime?: number;
}

/**
 * Options for verifying a Google Play purchase.
 * @since 0.1.0
 */
export interface AdjustPlayStorePurchaseOptions {
  /**
   * Nonempty Google Play purchase token.
   * @since 0.1.0
   */
  transactionId: string;
  /**
   * Nonempty product identifier.
   * @since 0.1.0
   */
  productId: string;
}

/**
 * Options for setting the referrer.
 * @since 0.1.0
 */
export interface AdjustReferrerOptions {
  /**
   * Nonempty referrer string.
   * @since 0.1.0
   */
  referrer: string;
}

/**
 * Tapp plugin API with the Adjust adapter. Includes every TappPlugin method
 * unchanged. On iOS and Android, every method below rejects with NOT_STARTED before
 * start(); a method that is not available on the current platform rejects with
 * UNIMPLEMENTED whether or not start() was called. Invalid input rejects with
 * INVALID_ARGUMENT (missing or blank strings, non-finite numbers). Optional output
 * fields are omitted when the native SDK returns no value; when it returns no result
 * where the result type requires one, the call rejects with UNAVAILABLE. On web, every
 * method below rejects with UNIMPLEMENTED.
 * @since 0.1.0
 */
export interface TappAdjustPlugin extends TappPlugin {
  /**
   * Send an Adjust event by token. iOS and Android. Rejects with NOT_STARTED before
   * start() or INVALID_ARGUMENT for a missing or blank eventToken. On web, rejects
   * with UNIMPLEMENTED.
   * Call start() first and await its successful completion.
   * @platform iOS, Android; unsupported on web.
   * @throws Rejects with UNIMPLEMENTED on web.
   * @throws Rejects with NOT_STARTED until native start() succeeds.
   * @throws Rejects with INVALID_ARGUMENT for invalid options as described above.
   * @throws Rejects with HANDLE_EVENT_ERROR if Android SDK event handling throws.
   * @example
   * await Tapp.handleEvent({ eventToken });
   * @since 0.1.0
   */
  handleEvent(options: AdjustEventOptions): Promise<void>;
  /**
   * Read the Adjust attribution. iOS and Android. Fields without a value are omitted;
   * fbInstallReferrer is Android only. Rejects with NOT_STARTED before start(). On web,
   * rejects with UNIMPLEMENTED.
   * Call start() first and await its successful completion.
   * The promise can remain pending if the native callback never fires; no timeout is added.
   * @platform iOS, Android; unsupported on web.
   * @throws Rejects with UNIMPLEMENTED on web.
   * @throws Rejects with NOT_STARTED until native start() succeeds.
   * @throws Rejects with UNAVAILABLE if the Android native call throws synchronously.
   * @example
   * await Tapp.getAdjustAttribution();
   * @since 0.1.0
   */
  getAdjustAttribution(): Promise<{ attribution: AdjustAttribution }>;
  /**
   * Read the Adjust device identifier. iOS and Android. adid is omitted when
   * unavailable. Rejects with NOT_STARTED before start(). On web, rejects with
   * UNIMPLEMENTED.
   * Call start() first and await its successful completion.
   * The promise can remain pending if the native callback never fires; no timeout is added.
   * @platform iOS, Android; unsupported on web.
   * @throws Rejects with UNIMPLEMENTED on web.
   * @throws Rejects with NOT_STARTED until native start() succeeds.
   * @throws Rejects with UNAVAILABLE if the Android native call throws synchronously.
   * @example
   * await Tapp.adjustGetAdid();
   * @since 0.1.0
   */
  adjustGetAdid(): Promise<{ adid?: string }>;
  /**
   * Read the advertising identifier through Adjust. iOS and Android (on Android the
   * native SDK reads the Google advertising identifier). idfa is omitted when
   * unavailable. Rejects with NOT_STARTED before start(). On web, rejects with
   * UNIMPLEMENTED.
   * Call start() first and await its successful completion.
   * The promise can remain pending if the native callback never fires; no timeout is added.
   * @platform iOS, Android; unsupported on web.
   * @throws Rejects with UNIMPLEMENTED on web.
   * @throws Rejects with NOT_STARTED until native start() succeeds.
   * @throws Rejects with UNAVAILABLE if the Android native call throws synchronously.
   * @example
   * await Tapp.adjustGetIdfa();
   * @since 0.1.0
   */
  adjustGetIdfa(): Promise<{ idfa?: string }>;
  /**
   * Track ad revenue. iOS and Android. Rejects with NOT_STARTED before start() or
   * INVALID_ARGUMENT for a blank source or currency or a non-finite or negative
   * revenue. On web, rejects with UNIMPLEMENTED.
   * Call start() first and await its successful completion.
   * @platform iOS, Android; unsupported on web.
   * @throws Rejects with UNIMPLEMENTED on web.
   * @throws Rejects with NOT_STARTED until native start() succeeds.
   * @throws Rejects with INVALID_ARGUMENT for invalid options as described above.
   * @throws Rejects with UNAVAILABLE if the Android native call throws synchronously.
   * @example
   * await Tapp.adjustTrackAdRevenue({ source, revenue, currency });
   * @since 0.1.0
   */
  adjustTrackAdRevenue(options: AdjustAdRevenueOptions): Promise<void>;
  /**
   * Set the push notification token. iOS and Android. Rejects with NOT_STARTED before
   * start() or INVALID_ARGUMENT for a missing or blank token. On web, rejects with
   * UNIMPLEMENTED.
   * Call start() first and await its successful completion.
   * @platform iOS, Android; unsupported on web.
   * @throws Rejects with UNIMPLEMENTED on web.
   * @throws Rejects with NOT_STARTED until native start() succeeds.
   * @throws Rejects with INVALID_ARGUMENT for invalid options as described above.
   * @throws Rejects with UNAVAILABLE if the Android native call throws synchronously.
   * @example
   * await Tapp.adjustSetPushToken({ token: pushToken });
   * @since 0.1.0
   */
  adjustSetPushToken(options: AdjustPushTokenOptions): Promise<void>;
  /**
   * Ask Adjust to forget this device (GDPR). iOS and Android. Rejects with NOT_STARTED
   * before start(). On web, rejects with UNIMPLEMENTED.
   * Call start() first and await its successful completion.
   * @platform iOS, Android; unsupported on web.
   * @throws Rejects with UNIMPLEMENTED on web.
   * @throws Rejects with NOT_STARTED until native start() succeeds.
   * @throws Rejects with UNAVAILABLE if the Android native call throws synchronously.
   * @example
   * await Tapp.adjustGdprForgetMe();
   * @since 0.1.0
   */
  adjustGdprForgetMe(): Promise<void>;
  /**
   * Enable or disable third-party sharing. iOS and Android. Rejects with NOT_STARTED
   * before start() or INVALID_ARGUMENT unless enabled is a boolean. On web, rejects
   * with UNIMPLEMENTED.
   * Call start() first and await its successful completion.
   * @platform iOS, Android; unsupported on web.
   * @throws Rejects with UNIMPLEMENTED on web.
   * @throws Rejects with NOT_STARTED until native start() succeeds.
   * @throws Rejects with INVALID_ARGUMENT for invalid options as described above.
   * @throws Rejects with UNAVAILABLE if the Android native call throws synchronously.
   * @example
   * await Tapp.adjustTrackThirdPartySharing({ enabled: false });
   * @since 0.1.0
   */
  adjustTrackThirdPartySharing(options: AdjustThirdPartySharingOptions): Promise<void>;
  /**
   * Record measurement consent. iOS and Android. Rejects with NOT_STARTED before
   * start() or INVALID_ARGUMENT unless consent is a boolean. On web, rejects with
   * UNIMPLEMENTED.
   * Call start() first and await its successful completion.
   * @platform iOS, Android; unsupported on web.
   * @throws Rejects with UNIMPLEMENTED on web.
   * @throws Rejects with NOT_STARTED until native start() succeeds.
   * @throws Rejects with INVALID_ARGUMENT for invalid options as described above.
   * @throws Rejects with UNAVAILABLE if the Android native call throws synchronously.
   * @example
   * await Tapp.adjustTrackMeasurementConsent({ consent: true });
   * @since 0.1.0
   */
  adjustTrackMeasurementConsent(options: AdjustMeasurementConsentOptions): Promise<void>;
  /**
   * Enable the Adjust SDK. iOS and Android. Rejects with NOT_STARTED before start().
   * On web, rejects with UNIMPLEMENTED.
   * Call start() first and await its successful completion.
   * @platform iOS, Android; unsupported on web.
   * @throws Rejects with UNIMPLEMENTED on web.
   * @throws Rejects with NOT_STARTED until native start() succeeds.
   * @throws Rejects with UNAVAILABLE if the Android native call throws synchronously.
   * @example
   * await Tapp.adjustEnable();
   * @since 0.1.0
   */
  adjustEnable(): Promise<void>;
  /**
   * Disable the Adjust SDK. iOS and Android. Rejects with NOT_STARTED before start().
   * On web, rejects with UNIMPLEMENTED.
   * Call start() first and await its successful completion.
   * @platform iOS, Android; unsupported on web.
   * @throws Rejects with UNIMPLEMENTED on web.
   * @throws Rejects with NOT_STARTED until native start() succeeds.
   * @throws Rejects with UNAVAILABLE if the Android native call throws synchronously.
   * @example
   * await Tapp.adjustDisable();
   * @since 0.1.0
   */
  adjustDisable(): Promise<void>;
  /**
   * Read whether the Adjust SDK is enabled. iOS and Android. Rejects with NOT_STARTED
   * before start(). On web, rejects with UNIMPLEMENTED.
   * Call start() first and await its successful completion.
   * The promise can remain pending if the native callback never fires; no timeout is added.
   * @platform iOS, Android; unsupported on web.
   * @throws Rejects with UNIMPLEMENTED on web.
   * @throws Rejects with NOT_STARTED until native start() succeeds.
   * @throws Rejects with UNAVAILABLE if the Android native call throws synchronously.
   * @example
   * await Tapp.adjustIsEnabled();
   * @since 0.1.0
   */
  adjustIsEnabled(): Promise<{ isEnabled: boolean }>;
  /**
   * Switch the Adjust SDK to offline mode. iOS and Android. Rejects with NOT_STARTED
   * before start(). On web, rejects with UNIMPLEMENTED.
   * Call start() first and await its successful completion.
   * @platform iOS, Android; unsupported on web.
   * @throws Rejects with UNIMPLEMENTED on web.
   * @throws Rejects with NOT_STARTED until native start() succeeds.
   * @throws Rejects with UNAVAILABLE if the Android native call throws synchronously.
   * @example
   * await Tapp.adjustSwitchToOfflineMode();
   * @since 0.1.0
   */
  adjustSwitchToOfflineMode(): Promise<void>;
  /**
   * Switch the Adjust SDK back to online mode. iOS and Android. Rejects with
   * NOT_STARTED before start(). On web, rejects with UNIMPLEMENTED.
   * Call start() first and await its successful completion.
   * @platform iOS, Android; unsupported on web.
   * @throws Rejects with UNIMPLEMENTED on web.
   * @throws Rejects with NOT_STARTED until native start() succeeds.
   * @throws Rejects with UNAVAILABLE if the Android native call throws synchronously.
   * @example
   * await Tapp.adjustSwitchBackToOnlineMode();
   * @since 0.1.0
   */
  adjustSwitchBackToOnlineMode(): Promise<void>;
  /**
   * Add a global callback parameter. iOS and Android. Rejects with NOT_STARTED before
   * start() or INVALID_ARGUMENT for a missing or blank key or value. On web, rejects
   * with UNIMPLEMENTED.
   * Call start() first and await its successful completion.
   * @platform iOS, Android; unsupported on web.
   * @throws Rejects with UNIMPLEMENTED on web.
   * @throws Rejects with NOT_STARTED until native start() succeeds.
   * @throws Rejects with INVALID_ARGUMENT for invalid options as described above.
   * @throws Rejects with UNAVAILABLE if the Android native call throws synchronously.
   * @example
   * await Tapp.adjustAddGlobalCallbackParameter({ key, value });
   * @since 0.1.0
   */
  adjustAddGlobalCallbackParameter(options: AdjustGlobalParameterOptions): Promise<void>;
  /**
   * Add a global partner parameter. iOS and Android. Rejects with NOT_STARTED before
   * start() or INVALID_ARGUMENT for a missing or blank key or value. On web, rejects
   * with UNIMPLEMENTED.
   * Call start() first and await its successful completion.
   * @platform iOS, Android; unsupported on web.
   * @throws Rejects with UNIMPLEMENTED on web.
   * @throws Rejects with NOT_STARTED until native start() succeeds.
   * @throws Rejects with INVALID_ARGUMENT for invalid options as described above.
   * @throws Rejects with UNAVAILABLE if the Android native call throws synchronously.
   * @example
   * await Tapp.adjustAddGlobalPartnerParameter({ key, value });
   * @since 0.1.0
   */
  adjustAddGlobalPartnerParameter(options: AdjustGlobalParameterOptions): Promise<void>;
  /**
   * Remove a global callback parameter. iOS and Android. Rejects with NOT_STARTED
   * before start() or INVALID_ARGUMENT for a missing or blank key. On web, rejects
   * with UNIMPLEMENTED.
   * Call start() first and await its successful completion.
   * @platform iOS, Android; unsupported on web.
   * @throws Rejects with UNIMPLEMENTED on web.
   * @throws Rejects with NOT_STARTED until native start() succeeds.
   * @throws Rejects with INVALID_ARGUMENT for invalid options as described above.
   * @throws Rejects with UNAVAILABLE if the Android native call throws synchronously.
   * @example
   * await Tapp.adjustRemoveGlobalCallbackParameter({ key });
   * @since 0.1.0
   */
  adjustRemoveGlobalCallbackParameter(options: AdjustGlobalParameterKeyOptions): Promise<void>;
  /**
   * Remove a global partner parameter. iOS and Android. Rejects with NOT_STARTED
   * before start() or INVALID_ARGUMENT for a missing or blank key. On web, rejects
   * with UNIMPLEMENTED.
   * Call start() first and await its successful completion.
   * @platform iOS, Android; unsupported on web.
   * @throws Rejects with UNIMPLEMENTED on web.
   * @throws Rejects with NOT_STARTED until native start() succeeds.
   * @throws Rejects with INVALID_ARGUMENT for invalid options as described above.
   * @throws Rejects with UNAVAILABLE if the Android native call throws synchronously.
   * @example
   * await Tapp.adjustRemoveGlobalPartnerParameter({ key });
   * @since 0.1.0
   */
  adjustRemoveGlobalPartnerParameter(options: AdjustGlobalParameterKeyOptions): Promise<void>;
  /**
   * Remove all global callback parameters. iOS and Android. Rejects with NOT_STARTED
   * before start(). On web, rejects with UNIMPLEMENTED.
   * Call start() first and await its successful completion.
   * @platform iOS, Android; unsupported on web.
   * @throws Rejects with UNIMPLEMENTED on web.
   * @throws Rejects with NOT_STARTED until native start() succeeds.
   * @throws Rejects with UNAVAILABLE if the Android native call throws synchronously.
   * @example
   * await Tapp.adjustRemoveGlobalCallbackParameters();
   * @since 0.1.0
   */
  adjustRemoveGlobalCallbackParameters(): Promise<void>;
  /**
   * Remove all global partner parameters. iOS and Android. Rejects with NOT_STARTED
   * before start(). On web, rejects with UNIMPLEMENTED.
   * Call start() first and await its successful completion.
   * @platform iOS, Android; unsupported on web.
   * @throws Rejects with UNIMPLEMENTED on web.
   * @throws Rejects with NOT_STARTED until native start() succeeds.
   * @throws Rejects with UNAVAILABLE if the Android native call throws synchronously.
   * @example
   * await Tapp.adjustRemoveGlobalPartnerParameters();
   * @since 0.1.0
   */
  adjustRemoveGlobalPartnerParameters(): Promise<void>;
  /**
   * Read the Adjust SDK version. iOS and Android. version is omitted when unavailable.
   * Rejects with NOT_STARTED before start(). On web, rejects with UNIMPLEMENTED.
   * Call start() first and await its successful completion.
   * The promise can remain pending if the native callback never fires; no timeout is added.
   * @platform iOS, Android; unsupported on web.
   * @throws Rejects with UNIMPLEMENTED on web.
   * @throws Rejects with NOT_STARTED until native start() succeeds.
   * @throws Rejects with UNAVAILABLE if the Android native call throws synchronously.
   * @example
   * await Tapp.adjustGetSdkVersion();
   * @since 0.1.0
   */
  adjustGetSdkVersion(): Promise<{ version?: string }>;
  /**
   * Verify an App Store purchase. iOS only; Android and web reject with UNIMPLEMENTED.
   * Rejects with NOT_STARTED before start(), INVALID_ARGUMENT for a missing or blank
   * transactionId or productId, or UNAVAILABLE if the native SDK returns no result.
   * Call start() first and await its successful completion.
   * The promise can remain pending if the native callback never fires; no timeout is added.
   * The platform gate runs before startup and input validation.
   * @platform iOS only; Android and web are unsupported.
   * @throws Rejects with UNIMPLEMENTED on Android and web, even before start().
   * @throws Rejects with NOT_STARTED until native start() succeeds.
   * @throws Rejects with INVALID_ARGUMENT for invalid options as described above.
   * @throws Rejects with UNAVAILABLE if no usable verification result is returned.
   * @example
   * await Tapp.adjustVerifyAppStorePurchase({ transactionId, productId });
   * @since 0.1.0
   */
  adjustVerifyAppStorePurchase(options: AdjustAppStorePurchaseOptions): Promise<VerifyResult>;
  /**
   * Track an App Store subscription (price, currency, and transactionId only). iOS
   * only; Android and web reject with UNIMPLEMENTED. Rejects with NOT_STARTED before
   * start() or INVALID_ARGUMENT for a non-finite price or a missing or blank currency
   * or transactionId.
   * Call start() first and await its successful completion.
   * The platform gate runs before startup and input validation.
   * @platform iOS only; Android and web are unsupported.
   * @throws Rejects with UNIMPLEMENTED on Android and web, even before start().
   * @throws Rejects with NOT_STARTED until native start() succeeds.
   * @throws Rejects with INVALID_ARGUMENT for invalid options as described above.
   * @example
   * await Tapp.adjustTrackAppStoreSubscription({ price, currency, transactionId });
   * @since 0.1.0
   */
  adjustTrackAppStoreSubscription(options: AdjustAppStoreSubscriptionOptions): Promise<void>;
  /**
   * Convert a universal link to a URL with the given scheme. iOS only; Android and web
   * reject with UNIMPLEMENTED. url is omitted when the native SDK cannot convert the
   * link. Rejects with NOT_STARTED before start(), INVALID_URL for an unparsable
   * universalLink, or INVALID_ARGUMENT for a missing or blank scheme.
   * Call start() first and await its successful completion.
   * The platform gate runs before startup and input validation.
   * @platform iOS only; Android and web are unsupported.
   * @throws Rejects with UNIMPLEMENTED on Android and web, even before start().
   * @throws Rejects with NOT_STARTED until native start() succeeds.
   * @throws Rejects with INVALID_ARGUMENT for invalid options as described above.
   * @throws Rejects with INVALID_URL for an invalid universalLink.
   * @example
   * await Tapp.adjustConvert({ universalLink, scheme });
   * @since 0.1.0
   */
  adjustConvert(options: AdjustConvertOptions): Promise<{ url?: string }>;
  /**
   * Request App Tracking Transparency authorization. iOS only; Android and web reject
   * with UNIMPLEMENTED. status is omitted when the native SDK returns no value. The host
   * app needs NSUserTrackingUsageDescription. Rejects with NOT_STARTED before start().
   * Call start() first and await its successful completion.
   * The promise can remain pending if the native callback never fires; no timeout is added.
   * The platform gate runs before startup and input validation.
   * @platform iOS only; Android and web are unsupported.
   * @throws Rejects with UNIMPLEMENTED on Android and web, even before start().
   * @throws Rejects with NOT_STARTED until native start() succeeds.
   * @example
   * await Tapp.adjustRequestAppTrackingAuthorization();
   * @since 0.1.0
   */
  adjustRequestAppTrackingAuthorization(): Promise<{ status?: number }>;
  /**
   * Read the App Tracking Transparency authorization status. iOS only; Android and web
   * reject with UNIMPLEMENTED. Rejects with NOT_STARTED before start().
   * Call start() first and await its successful completion.
   * Add NSUserTrackingUsageDescription to the host Info.plist before calling this API.
   * The platform gate runs before startup and input validation.
   * @platform iOS only; Android and web are unsupported.
   * @throws Rejects with UNIMPLEMENTED on Android and web, even before start().
   * @throws Rejects with NOT_STARTED until native start() succeeds.
   * @example
   * await Tapp.adjustAppTrackingAuthorizationStatus();
   * @since 0.1.0
   */
  adjustAppTrackingAuthorizationStatus(): Promise<{ status: number }>;
  /**
   * Update the SKAdNetwork conversion value. iOS only; Android and web reject with
   * UNIMPLEMENTED. Rejects with NOT_STARTED before start(), INVALID_ARGUMENT for a
   * non-integer value or an invalid optional field, or SKAN_ERROR when the native SDK
   * reports an error.
   * Call start() first and await its successful completion.
   * The promise can remain pending if the native callback never fires; no timeout is added.
   * The platform gate runs before startup and input validation.
   * @platform iOS only; Android and web are unsupported.
   * @throws Rejects with UNIMPLEMENTED on Android and web, even before start().
   * @throws Rejects with NOT_STARTED until native start() succeeds.
   * @throws Rejects with INVALID_ARGUMENT for invalid options as described above.
   * @throws Rejects with SKAN_ERROR if the native SDK reports a conversion update error.
   * @example
   * await Tapp.adjustUpdateSkanConversionValue({ value: conversionValue });
   * @since 0.1.0
   */
  adjustUpdateSkanConversionValue(options: AdjustSkanConversionValueOptions): Promise<void>;
  /**
   * Track a Google Play subscription. Android only; iOS and web reject with
   * UNIMPLEMENTED. Rejects with NOT_STARTED before start() or INVALID_ARGUMENT for a
   * non-finite price or purchaseTime or a missing or blank string field.
   * Call start() first and await its successful completion.
   * The platform gate runs before startup and input validation.
   * @platform Android only; iOS and web are unsupported.
   * @throws Rejects with UNIMPLEMENTED on iOS and web, even before start().
   * @throws Rejects with NOT_STARTED until native start() succeeds.
   * @throws Rejects with INVALID_ARGUMENT for invalid options as described above.
   * @throws Rejects with UNAVAILABLE if the Android native call throws synchronously.
   * @example
   * await Tapp.adjustTrackPlayStoreSubscription({ price: priceAmountMicros, currency, sku, orderId, signature, purchaseToken });
   * @since 0.1.0
   */
  adjustTrackPlayStoreSubscription(options: AdjustPlayStoreSubscriptionOptions): Promise<void>;
  /**
   * Verify a Google Play purchase. transactionId is the Play purchase token. Android
   * only; iOS and web reject with UNIMPLEMENTED. Rejects with NOT_STARTED before start(),
   * INVALID_ARGUMENT for a missing or blank transactionId or productId, or UNAVAILABLE if
   * the native SDK returns no result.
   * Call start() first and await its successful completion.
   * The promise can remain pending if the native callback never fires; no timeout is added.
   * The platform gate runs before startup and input validation.
   * @platform Android only; iOS and web are unsupported.
   * @throws Rejects with UNIMPLEMENTED on iOS and web, even before start().
   * @throws Rejects with NOT_STARTED until native start() succeeds.
   * @throws Rejects with INVALID_ARGUMENT for invalid options as described above.
   * @throws Rejects with UNAVAILABLE if the Android native call throws synchronously.
   * @throws Rejects with UNAVAILABLE if no usable verification result is returned.
   * @example
   * await Tapp.adjustVerifyPlayStorePurchase({ transactionId: purchaseToken, productId });
   * @since 0.1.0
   */
  adjustVerifyPlayStorePurchase(options: AdjustPlayStorePurchaseOptions): Promise<VerifyResult>;
  /**
   * Verify a Google Play purchase and track the Adjust event. Android only; iOS and web
   * reject with UNIMPLEMENTED. Rejects with NOT_STARTED before start(), INVALID_ARGUMENT
   * for a missing or blank eventToken, or UNAVAILABLE if the native SDK returns no result.
   * Call start() first and await its successful completion.
   * The promise can remain pending if the native callback never fires; no timeout is added.
   * The platform gate runs before startup and input validation.
   * @platform Android only; iOS and web are unsupported.
   * @throws Rejects with UNIMPLEMENTED on iOS and web, even before start().
   * @throws Rejects with NOT_STARTED until native start() succeeds.
   * @throws Rejects with INVALID_ARGUMENT for invalid options as described above.
   * @throws Rejects with UNAVAILABLE if the Android native call throws synchronously.
   * @throws Rejects with UNAVAILABLE if no usable verification result is returned.
   * @example
   * await Tapp.adjustVerifyAndTrackPlayStorePurchase({ eventToken });
   * @since 0.1.0
   */
  adjustVerifyAndTrackPlayStorePurchase(options: AdjustEventOptions): Promise<VerifyResult>;
  /**
   * Read the Google advertising identifier. Android only; iOS and web reject with
   * UNIMPLEMENTED. googleAdId is omitted when unavailable. Rejects with NOT_STARTED
   * before start().
   * Call start() first and await its successful completion.
   * The promise can remain pending if the native callback never fires; no timeout is added.
   * The platform gate runs before startup and input validation.
   * @platform Android only; iOS and web are unsupported.
   * @throws Rejects with UNIMPLEMENTED on iOS and web, even before start().
   * @throws Rejects with NOT_STARTED until native start() succeeds.
   * @throws Rejects with UNAVAILABLE if the Android native call throws synchronously.
   * @example
   * await Tapp.adjustGetGoogleAdId();
   * @since 0.1.0
   */
  adjustGetGoogleAdId(): Promise<{ googleAdId?: string }>;
  /**
   * Read the Amazon advertising identifier. Android only; iOS and web reject with
   * UNIMPLEMENTED. amazonAdId is omitted when unavailable. Rejects with NOT_STARTED
   * before start().
   * Call start() first and await its successful completion.
   * The promise can remain pending if the native callback never fires; no timeout is added.
   * The platform gate runs before startup and input validation.
   * @platform Android only; iOS and web are unsupported.
   * @throws Rejects with UNIMPLEMENTED on iOS and web, even before start().
   * @throws Rejects with NOT_STARTED until native start() succeeds.
   * @throws Rejects with UNAVAILABLE if the Android native call throws synchronously.
   * @example
   * await Tapp.adjustGetAmazonAdId();
   * @since 0.1.0
   */
  adjustGetAmazonAdId(): Promise<{ amazonAdId?: string }>;
  /**
   * Read the Google Play install referrer. Android only; iOS and web reject with
   * UNIMPLEMENTED. Unavailable fields are omitted. Rejects with NOT_STARTED before
   * start() or INSTALL_REFERRER_ERROR when the native read fails.
   * Call start() first and await its successful completion.
   * The promise can remain pending if the native callback never fires; no timeout is added.
   * The platform gate runs before startup and input validation.
   * @platform Android only; iOS and web are unsupported.
   * @throws Rejects with UNIMPLEMENTED on iOS and web, even before start().
   * @throws Rejects with NOT_STARTED until native start() succeeds.
   * @throws Rejects with UNAVAILABLE if the Android native call throws synchronously.
   * @throws Rejects with INSTALL_REFERRER_ERROR if the native referrer read fails.
   * @example
   * await Tapp.adjustGetGooglePlayInstallReferrer();
   * @since 0.1.0
   */
  adjustGetGooglePlayInstallReferrer(): Promise<AdjustInstallReferrer>;
  /**
   * Set the referrer. Android only; iOS and web reject with UNIMPLEMENTED. Rejects with
   * NOT_STARTED before start() or INVALID_ARGUMENT for a missing or blank referrer.
   * Call start() first and await its successful completion.
   * The platform gate runs before startup and input validation.
   * @platform Android only; iOS and web are unsupported.
   * @throws Rejects with UNIMPLEMENTED on iOS and web, even before start().
   * @throws Rejects with NOT_STARTED until native start() succeeds.
   * @throws Rejects with INVALID_ARGUMENT for invalid options as described above.
   * @throws Rejects with UNAVAILABLE if the Android native call throws synchronously.
   * @example
   * await Tapp.adjustSetReferrer({ referrer });
   * @since 0.1.0
   */
  adjustSetReferrer(options: AdjustReferrerOptions): Promise<void>;
}

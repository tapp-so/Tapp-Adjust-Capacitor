import { CapacitorException, WebPlugin, type ExceptionCode } from '@capacitor/core';

import type {
  AdjustAdRevenueOptions,
  AdjustAppStorePurchaseOptions,
  AdjustAppStoreSubscriptionOptions,
  AdjustAttribution,
  AdjustConvertOptions,
  AdjustEventOptions,
  AdjustGlobalParameterKeyOptions,
  AdjustGlobalParameterOptions,
  AdjustInstallReferrer,
  AdjustMeasurementConsentOptions,
  AdjustPlayStorePurchaseOptions,
  AdjustPlayStoreSubscriptionOptions,
  AdjustPushTokenOptions,
  AdjustReferrerOptions,
  AdjustSkanConversionValueOptions,
  AdjustThirdPartySharingOptions,
  TappAdjustPlugin,
  TappEventOptions,
  TappLinkData,
  TappStartOptions,
  TappUrlOptions,
  VerifyResult,
} from './definitions';
import { validateTappUrl } from './url';

function isNonemptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

/**
 * Web fallback for the native Tapp SDK. Every Adjust method rejects with UNIMPLEMENTED.
 * @since 0.1.0
 */
export class TappWeb extends WebPlugin implements TappAdjustPlugin {
  private warned = false;

  /**
   * Validate credentials and resolve without initializing a native SDK. Warn once per instance.
   * @since 0.1.0
   */
  async start(options: TappStartOptions): Promise<void> {
    if (
      !isNonemptyString(options?.authToken) ||
      !isNonemptyString(options?.tappToken) ||
      (options?.env !== 'PRODUCTION' && options?.env !== 'SANDBOX')
    ) {
      throw new CapacitorException(
        'authToken, tappToken, and a PRODUCTION or SANDBOX env are required.',
        'INVALID_ARGUMENT' as ExceptionCode,
      );
    }
    if (!this.warned) {
      this.warned = true;
      console.warn('Tapp is not supported on web.');
    }
  }

  /**
   * Reject because link generation requires a native platform.
   * @since 0.1.0
   */
  async url(_options: TappUrlOptions): Promise<{ url: string }> {
    throw this.unimplemented('Not implemented on web.');
  }

  /**
   * Reject because event delivery requires a native platform.
   * @since 0.1.0
   */
  async handleTappEvent(_options: TappEventOptions): Promise<void> {
    throw this.unimplemented('Not implemented on web.');
  }

  /**
   * Validate a nonempty URL and resolve with false on web.
   * @since 0.1.0
   */
  async shouldProcess(options: { url: string }): Promise<{ value: boolean }> {
    this.validateUrl(options);
    return { value: false };
  }

  /**
   * Reject invalid input; otherwise resolve with an unsupported-platform error payload.
   * @since 0.1.0
   */
  async fetchLinkData(options: { url: string }): Promise<TappLinkData> {
    this.validateUrl(options);
    return this.unsupportedLinkData();
  }

  /**
   * Resolve with an unsupported-platform error payload.
   * @since 0.1.0
   */
  async fetchOriginLinkData(): Promise<TappLinkData> {
    return this.unsupportedLinkData();
  }

  /**
   * Reject because Adjust event delivery requires a native platform.
   * @since 0.1.0
   */
  async handleEvent(_options: AdjustEventOptions): Promise<void> {
    throw this.unimplemented('Not implemented on web.');
  }

  /**
   * Reject because the Adjust SDK requires a native platform.
   * @since 0.1.0
   */
  async getAdjustAttribution(): Promise<{ attribution: AdjustAttribution }> {
    throw this.unimplemented('Not implemented on web.');
  }

  /**
   * Reject because the Adjust SDK requires a native platform.
   * @since 0.1.0
   */
  async adjustGetAdid(): Promise<{ adid?: string }> {
    throw this.unimplemented('Not implemented on web.');
  }

  /**
   * Reject because the Adjust SDK requires a native platform.
   * @since 0.1.0
   */
  async adjustGetIdfa(): Promise<{ idfa?: string }> {
    throw this.unimplemented('Not implemented on web.');
  }

  /**
   * Reject because the Adjust SDK requires a native platform.
   * @since 0.1.0
   */
  async adjustTrackAdRevenue(_options: AdjustAdRevenueOptions): Promise<void> {
    throw this.unimplemented('Not implemented on web.');
  }

  /**
   * Reject because the Adjust SDK requires a native platform.
   * @since 0.1.0
   */
  async adjustSetPushToken(_options: AdjustPushTokenOptions): Promise<void> {
    throw this.unimplemented('Not implemented on web.');
  }

  /**
   * Reject because the Adjust SDK requires a native platform.
   * @since 0.1.0
   */
  async adjustGdprForgetMe(): Promise<void> {
    throw this.unimplemented('Not implemented on web.');
  }

  /**
   * Reject because the Adjust SDK requires a native platform.
   * @since 0.1.0
   */
  async adjustTrackThirdPartySharing(_options: AdjustThirdPartySharingOptions): Promise<void> {
    throw this.unimplemented('Not implemented on web.');
  }

  /**
   * Reject because the Adjust SDK requires a native platform.
   * @since 0.1.0
   */
  async adjustTrackMeasurementConsent(_options: AdjustMeasurementConsentOptions): Promise<void> {
    throw this.unimplemented('Not implemented on web.');
  }

  /**
   * Reject because the Adjust SDK requires a native platform.
   * @since 0.1.0
   */
  async adjustEnable(): Promise<void> {
    throw this.unimplemented('Not implemented on web.');
  }

  /**
   * Reject because the Adjust SDK requires a native platform.
   * @since 0.1.0
   */
  async adjustDisable(): Promise<void> {
    throw this.unimplemented('Not implemented on web.');
  }

  /**
   * Reject because the Adjust SDK requires a native platform.
   * @since 0.1.0
   */
  async adjustIsEnabled(): Promise<{ isEnabled: boolean }> {
    throw this.unimplemented('Not implemented on web.');
  }

  /**
   * Reject because the Adjust SDK requires a native platform.
   * @since 0.1.0
   */
  async adjustSwitchToOfflineMode(): Promise<void> {
    throw this.unimplemented('Not implemented on web.');
  }

  /**
   * Reject because the Adjust SDK requires a native platform.
   * @since 0.1.0
   */
  async adjustSwitchBackToOnlineMode(): Promise<void> {
    throw this.unimplemented('Not implemented on web.');
  }

  /**
   * Reject because the Adjust SDK requires a native platform.
   * @since 0.1.0
   */
  async adjustAddGlobalCallbackParameter(_options: AdjustGlobalParameterOptions): Promise<void> {
    throw this.unimplemented('Not implemented on web.');
  }

  /**
   * Reject because the Adjust SDK requires a native platform.
   * @since 0.1.0
   */
  async adjustAddGlobalPartnerParameter(_options: AdjustGlobalParameterOptions): Promise<void> {
    throw this.unimplemented('Not implemented on web.');
  }

  /**
   * Reject because the Adjust SDK requires a native platform.
   * @since 0.1.0
   */
  async adjustRemoveGlobalCallbackParameter(
    _options: AdjustGlobalParameterKeyOptions,
  ): Promise<void> {
    throw this.unimplemented('Not implemented on web.');
  }

  /**
   * Reject because the Adjust SDK requires a native platform.
   * @since 0.1.0
   */
  async adjustRemoveGlobalPartnerParameter(
    _options: AdjustGlobalParameterKeyOptions,
  ): Promise<void> {
    throw this.unimplemented('Not implemented on web.');
  }

  /**
   * Reject because the Adjust SDK requires a native platform.
   * @since 0.1.0
   */
  async adjustRemoveGlobalCallbackParameters(): Promise<void> {
    throw this.unimplemented('Not implemented on web.');
  }

  /**
   * Reject because the Adjust SDK requires a native platform.
   * @since 0.1.0
   */
  async adjustRemoveGlobalPartnerParameters(): Promise<void> {
    throw this.unimplemented('Not implemented on web.');
  }

  /**
   * Reject because the Adjust SDK requires a native platform.
   * @since 0.1.0
   */
  async adjustGetSdkVersion(): Promise<{ version?: string }> {
    throw this.unimplemented('Not implemented on web.');
  }

  /**
   * Reject because the Adjust SDK requires a native platform.
   * @since 0.1.0
   */
  async adjustVerifyAppStorePurchase(
    _options: AdjustAppStorePurchaseOptions,
  ): Promise<VerifyResult> {
    throw this.unimplemented('Not implemented on web.');
  }

  /**
   * Reject because the Adjust SDK requires a native platform.
   * @since 0.1.0
   */
  async adjustTrackAppStoreSubscription(
    _options: AdjustAppStoreSubscriptionOptions,
  ): Promise<void> {
    throw this.unimplemented('Not implemented on web.');
  }

  /**
   * Reject because the Adjust SDK requires a native platform.
   * @since 0.1.0
   */
  async adjustConvert(_options: AdjustConvertOptions): Promise<{ url?: string }> {
    throw this.unimplemented('Not implemented on web.');
  }

  /**
   * Reject because the Adjust SDK requires a native platform.
   * @since 0.1.0
   */
  async adjustRequestAppTrackingAuthorization(): Promise<{ status?: number }> {
    throw this.unimplemented('Not implemented on web.');
  }

  /**
   * Reject because the Adjust SDK requires a native platform.
   * @since 0.1.0
   */
  async adjustAppTrackingAuthorizationStatus(): Promise<{ status: number }> {
    throw this.unimplemented('Not implemented on web.');
  }

  /**
   * Reject because the Adjust SDK requires a native platform.
   * @since 0.1.0
   */
  async adjustUpdateSkanConversionValue(_options: AdjustSkanConversionValueOptions): Promise<void> {
    throw this.unimplemented('Not implemented on web.');
  }

  /**
   * Reject because the Adjust SDK requires a native platform.
   * @since 0.1.0
   */
  async adjustTrackPlayStoreSubscription(
    _options: AdjustPlayStoreSubscriptionOptions,
  ): Promise<void> {
    throw this.unimplemented('Not implemented on web.');
  }

  /**
   * Reject because the Adjust SDK requires a native platform.
   * @since 0.1.0
   */
  async adjustVerifyPlayStorePurchase(
    _options: AdjustPlayStorePurchaseOptions,
  ): Promise<VerifyResult> {
    throw this.unimplemented('Not implemented on web.');
  }

  /**
   * Reject because the Adjust SDK requires a native platform.
   * @since 0.1.0
   */
  async adjustVerifyAndTrackPlayStorePurchase(_options: AdjustEventOptions): Promise<VerifyResult> {
    throw this.unimplemented('Not implemented on web.');
  }

  /**
   * Reject because the Adjust SDK requires a native platform.
   * @since 0.1.0
   */
  async adjustGetGoogleAdId(): Promise<{ googleAdId?: string }> {
    throw this.unimplemented('Not implemented on web.');
  }

  /**
   * Reject because the Adjust SDK requires a native platform.
   * @since 0.1.0
   */
  async adjustGetAmazonAdId(): Promise<{ amazonAdId?: string }> {
    throw this.unimplemented('Not implemented on web.');
  }

  /**
   * Reject because the Adjust SDK requires a native platform.
   * @since 0.1.0
   */
  async adjustGetGooglePlayInstallReferrer(): Promise<AdjustInstallReferrer> {
    throw this.unimplemented('Not implemented on web.');
  }

  /**
   * Reject because the Adjust SDK requires a native platform.
   * @since 0.1.0
   */
  async adjustSetReferrer(_options: AdjustReferrerOptions): Promise<void> {
    throw this.unimplemented('Not implemented on web.');
  }

  private validateUrl(options: { url: string }): void {
    if (validateTappUrl(options?.url) === null)
      throw new CapacitorException(
        'url must be a nonempty, valid URL.',
        'INVALID_URL' as ExceptionCode,
      );
  }

  private unsupportedLinkData(): TappLinkData {
    return { error: true, message: 'Tapp is not supported on web.' };
  }
}

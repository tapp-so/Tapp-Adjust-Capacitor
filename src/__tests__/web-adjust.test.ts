import type { TappAdjustPlugin, TappPlugin } from '../definitions';
import { TappWeb } from '../web';

type AdjustMethod = Exclude<keyof TappAdjustPlugin, keyof TappPlugin>;

// The exact Adjust surface from the scaffold facts: no more, no fewer.
const ADJUST_METHODS = [
  'handleEvent',
  'getAdjustAttribution',
  'adjustGetAdid',
  'adjustGetIdfa',
  'adjustTrackAdRevenue',
  'adjustSetPushToken',
  'adjustGdprForgetMe',
  'adjustTrackThirdPartySharing',
  'adjustTrackMeasurementConsent',
  'adjustEnable',
  'adjustDisable',
  'adjustIsEnabled',
  'adjustSwitchToOfflineMode',
  'adjustSwitchBackToOnlineMode',
  'adjustAddGlobalCallbackParameter',
  'adjustAddGlobalPartnerParameter',
  'adjustRemoveGlobalCallbackParameter',
  'adjustRemoveGlobalPartnerParameter',
  'adjustRemoveGlobalCallbackParameters',
  'adjustRemoveGlobalPartnerParameters',
  'adjustGetSdkVersion',
  'adjustVerifyAppStorePurchase',
  'adjustTrackAppStoreSubscription',
  'adjustConvert',
  'adjustRequestAppTrackingAuthorization',
  'adjustAppTrackingAuthorizationStatus',
  'adjustUpdateSkanConversionValue',
  'adjustTrackPlayStoreSubscription',
  'adjustVerifyPlayStorePurchase',
  'adjustVerifyAndTrackPlayStorePurchase',
  'adjustGetGoogleAdId',
  'adjustGetAmazonAdId',
  'adjustGetGooglePlayInstallReferrer',
  'adjustSetReferrer',
] as const satisfies readonly AdjustMethod[];

// Compile-time guard: every method TappAdjustPlugin adds over TappPlugin is listed above.
type Unlisted = Exclude<AdjustMethod, (typeof ADJUST_METHODS)[number]>;
const everyMethodListed: [Unlisted] extends [never] ? true : false = true;

const CORE_METHODS = [
  'start',
  'url',
  'handleTappEvent',
  'shouldProcess',
  'fetchLinkData',
  'fetchOriginLinkData',
];

function ownMethodNames(): string[] {
  return Object.getOwnPropertyNames(TappWeb.prototype).filter(
    (name) =>
      name !== 'constructor' &&
      typeof (TappWeb.prototype as unknown as Record<string, unknown>)[name] === 'function',
  );
}

describe('TappWeb Adjust stubs', () => {
  it('lists exactly the 34 Adjust methods without duplicates', () => {
    expect(everyMethodListed).toBe(true);
    expect(ADJUST_METHODS).toHaveLength(34);
    expect(new Set(ADJUST_METHODS).size).toBe(ADJUST_METHODS.length);
  });

  it('defines exactly the core methods, the Adjust methods, and private helpers', () => {
    const helpers = ['validateUrl', 'unsupportedLinkData'];
    expect(ownMethodNames().sort()).toEqual(
      [...CORE_METHODS, ...ADJUST_METHODS, ...helpers].sort(),
    );
  });

  it('does not expose lifecycle forwarding to JS', () => {
    expect(ownMethodNames()).not.toContain('adjustOnResume');
    expect(ownMethodNames()).not.toContain('adjustOnPause');
  });

  it.each(ADJUST_METHODS)('%s rejects with UNIMPLEMENTED', async (method) => {
    const web = new TappWeb();
    const call = (web[method] as (options?: unknown) => Promise<unknown>).bind(web);
    for (const input of [undefined, {}]) {
      await expect(call(input)).rejects.toMatchObject({
        code: 'UNIMPLEMENTED',
        message: 'Not implemented on web.',
      });
    }
  });
});

import Foundation
import Capacitor
import Tapp
import TappNetworking
import TappAdjust

// Tapp and TappAdjust both re-declare typealiases for TappNetworking types, so the
// aliased names used here (TappConfiguration, AffiliateURLConfiguration,
// EventActionMapper, EventConfig) are qualified as TappNetworking.X.
@objc(TappAdjustPlugin)
public class TappAdjustPlugin: CAPPlugin, CAPBridgedPlugin, TappDelegate {
    public let identifier = "TappAdjustPlugin"
    public let jsName = "Tapp"
    // Core methods plus every TappAdjustPlugin method, including the Android-only ones,
    // which reject with UNIMPLEMENTED instead of leaving the promise pending.
    public let pluginMethods: [CAPPluginMethod] = TappAdjustMapping.pluginMethodNames.map {
        CAPPluginMethod(name: $0, returnType: CAPPluginReturnPromise)
    }

    // Accessed only on the main queue, including concurrent JS start calls.
    private var started = false
    private static let notStartedMessage = TappAdjustMapping.notStartedMessage

    // MARK: - Core methods

    @objc public func start(_ call: CAPPluginCall) {
        DispatchQueue.main.async {
            guard !self.started else {
                call.resolve()
                return
            }
            guard let authToken = call.getString("authToken"), !authToken.isEmpty,
                  let tappToken = call.getString("tappToken"), !tappToken.isEmpty,
                  let env = call.getString("env"), ["PRODUCTION", "SANDBOX"].contains(env) else {
                call.reject("authToken and tappToken must be nonempty strings; env must be PRODUCTION or SANDBOX.", "INVALID_ARGUMENT")
                return
            }
            let config = TappNetworking.TappConfiguration(
                authToken: authToken, env: env == "PRODUCTION" ? .production : .sandbox,
                tappToken: tappToken, affiliate: .adjust, bundleID: Bundle.main.bundleIdentifier
            )
            // Match RN's main-queue initialization; the SDK starts its own asynchronous work.
            Tapp.start(config: config, delegate: self)
            self.started = true
            call.resolve()
        }
    }

    @objc public func url(_ call: CAPPluginCall) {
        DispatchQueue.main.async {
            guard self.started else {
                call.reject(Self.notStartedMessage, "NOT_STARTED")
                return
            }
            guard let influencer = call.getString("influencer"), !influencer.isEmpty else {
                call.reject("influencer must be a nonempty string.", "INVALID_ARGUMENT")
                return
            }
            let config = TappNetworking.AffiliateURLConfiguration(
                influencer: influencer, adgroup: call.getString("adGroup"),
                creative: call.getString("creative"), data: TappAdjustMapping.stringData(call.getObject("data"))
            )
            Tapp.url(config: config) { result in
                DispatchQueue.main.async {
                    switch result {
                    case .success(let response): call.resolve(["url": response.url.absoluteString])
                    case .failure(let error):
                        // URL generation rejects as RN does; it is not a link-data resolution.
                        call.reject(error.localizedDescription, "URL_ERROR", error)
                    }
                }
            }
        }
    }

    @objc public func handleTappEvent(_ call: CAPPluginCall) {
        DispatchQueue.main.async {
            guard self.started else {
                call.reject(Self.notStartedMessage, "NOT_STARTED")
                return
            }
            guard let name = TappAdjustMapping.eventName(
                action: call.getValue("eventAction"), customValue: call.getString("customValue")
            ) else {
                call.reject("eventAction must be an integer from 0 through 40.", "INVALID_ARGUMENT")
                return
            }
            // Use the Swift initializer: the Any-based initializer can coerce Bool to Int.
            let event = TappEvent(
                eventAction: TappNetworking.EventActionMapper(eventActionName: name).eventAction,
                metadata: TappAdjustMapping.metadata(call.getObject("metadata"))
            )
            Tapp.handleTappEvent(event: event)
            call.resolve()
        }
    }

    @objc public func shouldProcess(_ call: CAPPluginCall) {
        guard let url = TappAdjustMapping.parsedURL(call.getString("url")) else {
            call.reject("url must be a nonempty, valid URL.", "INVALID_URL")
            return
        }
        DispatchQueue.main.async {
            call.resolve(["value": Tapp.shouldProcess(url: url)])
        }
    }

    @objc public func fetchLinkData(_ call: CAPPluginCall) {
        guard let url = TappAdjustMapping.parsedURL(call.getString("url")) else {
            call.reject("url must be a nonempty, valid URL.", "INVALID_URL")
            return
        }
        DispatchQueue.main.async {
            guard self.started else {
                call.resolve(TappAdjustMapping.failure(message: Self.notStartedMessage))
                return
            }
            Tapp.fetchLinkData(for: url) { result in
                self.resolveLinkData(call, result: result)
            }
        }
    }

    @objc public func fetchOriginLinkData(_ call: CAPPluginCall) {
        DispatchQueue.main.async {
            guard self.started else {
                call.resolve(TappAdjustMapping.failure(message: Self.notStartedMessage))
                return
            }
            Tapp.fetchOriginLinkData { result in
                self.resolveLinkData(call, result: result)
            }
        }
    }

    private func resolveLinkData(_ call: CAPPluginCall, result: Result<TappDeferredLinkData, Error>) {
        DispatchQueue.main.async {
            switch result {
            case .success(let data): call.resolve(self.dictionary(from: data))
            case .failure(let error): call.resolve(TappAdjustMapping.failure(message: error.localizedDescription))
            }
        }
    }

    private func dictionary(from data: TappDeferredLinkData) -> [String: Any] {
        TappAdjustMapping.linkData(
            tappURL: data.tappURL, attributedTappURL: data.attributedTappURL,
            influencer: data.influencer, data: data.data, isFirstSession: data.isFirstSession
        )
    }

    public func didOpenApplication(with data: TappDeferredLinkData) {
        DispatchQueue.main.async {
            self.notifyListeners("deferredLinkReceived", data: self.dictionary(from: data), retainUntilConsumed: true)
        }
    }

    public func didFailResolvingURL(url: URL, error: Error) {
        DispatchQueue.main.async {
            self.notifyListeners("didFailResolvingURL", data: [
                "url": url.absoluteString, "error": error.localizedDescription
            ], retainUntilConsumed: true)
        }
    }

    // MARK: - Adjust gating helpers

    /// On the main queue: platform gate (UNIMPLEMENTED), then NOT_STARTED, then `body`,
    /// which validates input and calls the native SDK.
    private func gated(
        _ call: CAPPluginCall, _ method: TappAdjustMapping.Method,
        _ body: @escaping (_ read: TappAdjustMapping.Reader) -> Void
    ) {
        DispatchQueue.main.async {
            if let rejection = TappAdjustMapping.gateRejection(for: method, started: self.started) {
                call.reject(rejection.message, rejection.code)
                return
            }
            body { key in call.getValue(key) as Any? }
        }
    }

    /// Gated call with no result: run the native action and resolve.
    private func gatedAction(_ call: CAPPluginCall, _ method: TappAdjustMapping.Method, _ action: @escaping () -> Void) {
        gated(call, method) { _ in
            action()
            call.resolve()
        }
    }

    private func resolveOnMain(_ call: CAPPluginCall, _ data: [String: Any]) {
        DispatchQueue.main.async {
            call.resolve(data)
        }
    }

    /// The platform gate rejects first; the body rejects too so the call always settles.
    private func androidOnly(_ call: CAPPluginCall, _ method: TappAdjustMapping.Method) {
        gated(call, method) { _ in
            call.reject("\(method.rawValue) is not available on iOS.", "UNIMPLEMENTED")
        }
    }

    private func rejectInvalid(_ call: CAPPluginCall, _ message: String) {
        call.reject(message, "INVALID_ARGUMENT")
    }

    // MARK: - Adjust: iOS and Android

    @objc public func handleEvent(_ call: CAPPluginCall) {
        gated(call, .handleEvent) { read in
            guard let eventToken = TappAdjustMapping.eventToken(read) else {
                self.rejectInvalid(call, "eventToken must be a nonblank string.")
                return
            }
            Tapp.handleEvent(config: TappNetworking.EventConfig(eventToken: eventToken))
            call.resolve()
        }
    }

    @objc public func getAdjustAttribution(_ call: CAPPluginCall) {
        gated(call, .getAdjustAttribution) { _ in
            Tapp.getAdjustAttribution(completion: { attribution in
                let mapped = attribution.map {
                    TappAdjustMapping.attribution(
                        trackerToken: $0.trackerToken, trackerName: $0.trackerName,
                        network: $0.network, campaign: $0.campaign, adGroup: $0.adGroup,
                        creative: $0.creative, clickLabel: $0.clickLabel, costType: $0.costType,
                        costAmount: $0.costAmount, costCurrency: $0.costCurrency
                    )
                }
                self.resolveOnMain(call, TappAdjustMapping.attributionResult(mapped))
            })
        }
    }

    @objc public func adjustGetAdid(_ call: CAPPluginCall) {
        gated(call, .adjustGetAdid) { _ in
            Tapp.adjustGetAdid(completion: { adid in
                self.resolveOnMain(call, TappAdjustMapping.optionalString("adid", adid))
            })
        }
    }

    @objc public func adjustGetIdfa(_ call: CAPPluginCall) {
        gated(call, .adjustGetIdfa) { _ in
            Tapp.adjustGetIdfa(completion: { idfa in
                self.resolveOnMain(call, TappAdjustMapping.optionalString("idfa", idfa))
            })
        }
    }

    @objc public func adjustTrackAdRevenue(_ call: CAPPluginCall) {
        gated(call, .adjustTrackAdRevenue) { read in
            guard let input = TappAdjustMapping.adRevenue(read) else {
                self.rejectInvalid(call, "source and currency must be nonblank strings; revenue must be a finite, non-negative number.")
                return
            }
            Tapp.adjustTrackAdRevenue(source: input.source, revenue: input.revenue, currency: input.currency)
            call.resolve()
        }
    }

    @objc public func adjustSetPushToken(_ call: CAPPluginCall) {
        gated(call, .adjustSetPushToken) { read in
            guard let token = TappAdjustMapping.nonBlankString(read("token")) else {
                self.rejectInvalid(call, "token must be a nonblank string.")
                return
            }
            Tapp.adjustSetPushToken(token: token)
            call.resolve()
        }
    }

    @objc public func adjustGdprForgetMe(_ call: CAPPluginCall) {
        gatedAction(call, .adjustGdprForgetMe) { Tapp.adjustGdprForgetMe() }
    }

    @objc public func adjustTrackThirdPartySharing(_ call: CAPPluginCall) {
        gated(call, .adjustTrackThirdPartySharing) { read in
            guard let enabled = TappAdjustMapping.strictBool(read("enabled")) else {
                self.rejectInvalid(call, "enabled must be a boolean.")
                return
            }
            Tapp.adjustTrackThirdPartySharing(isEnabled: enabled)
            call.resolve()
        }
    }

    @objc public func adjustTrackMeasurementConsent(_ call: CAPPluginCall) {
        gated(call, .adjustTrackMeasurementConsent) { read in
            guard let consent = TappAdjustMapping.strictBool(read("consent")) else {
                self.rejectInvalid(call, "consent must be a boolean.")
                return
            }
            Tapp.adjustTrackMeasurementConsent(consent)
            call.resolve()
        }
    }

    @objc public func adjustEnable(_ call: CAPPluginCall) {
        gatedAction(call, .adjustEnable) { Tapp.adjustEnable() }
    }

    @objc public func adjustDisable(_ call: CAPPluginCall) {
        gatedAction(call, .adjustDisable) { Tapp.adjustDisable() }
    }

    @objc public func adjustIsEnabled(_ call: CAPPluginCall) {
        gated(call, .adjustIsEnabled) { _ in
            Tapp.adjustIsEnabled(completion: { enabled in
                self.resolveOnMain(call, TappAdjustMapping.isEnabled(enabled))
            })
        }
    }

    @objc public func adjustSwitchToOfflineMode(_ call: CAPPluginCall) {
        gatedAction(call, .adjustSwitchToOfflineMode) { Tapp.adjustSwitchToOfflineMode() }
    }

    @objc public func adjustSwitchBackToOnlineMode(_ call: CAPPluginCall) {
        gatedAction(call, .adjustSwitchBackToOnlineMode) { Tapp.adjustSwitchBackToOnlineMode() }
    }

    @objc public func adjustAddGlobalCallbackParameter(_ call: CAPPluginCall) {
        gated(call, .adjustAddGlobalCallbackParameter) { read in
            // The native signature is (value, key:); the mapping passes them in that order.
            guard TappAdjustMapping.addGlobalParameter(read, using: Tapp.adjustAddGlobalCallbackParameter(_:key:)) else {
                self.rejectInvalid(call, "key and value must be nonblank strings.")
                return
            }
            call.resolve()
        }
    }

    @objc public func adjustAddGlobalPartnerParameter(_ call: CAPPluginCall) {
        gated(call, .adjustAddGlobalPartnerParameter) { read in
            guard TappAdjustMapping.addGlobalParameter(read, using: Tapp.adjustAddGlobalPartnerParameter(_:key:)) else {
                self.rejectInvalid(call, "key and value must be nonblank strings.")
                return
            }
            call.resolve()
        }
    }

    @objc public func adjustRemoveGlobalCallbackParameter(_ call: CAPPluginCall) {
        gated(call, .adjustRemoveGlobalCallbackParameter) { read in
            guard let key = TappAdjustMapping.nonBlankString(read("key")) else {
                self.rejectInvalid(call, "key must be a nonblank string.")
                return
            }
            Tapp.adjustRemoveGlobalCallbackParameter(for: key)
            call.resolve()
        }
    }

    @objc public func adjustRemoveGlobalPartnerParameter(_ call: CAPPluginCall) {
        gated(call, .adjustRemoveGlobalPartnerParameter) { read in
            guard let key = TappAdjustMapping.nonBlankString(read("key")) else {
                self.rejectInvalid(call, "key must be a nonblank string.")
                return
            }
            Tapp.adjustRemoveGlobalPartnerParameter(for: key)
            call.resolve()
        }
    }

    @objc public func adjustRemoveGlobalCallbackParameters(_ call: CAPPluginCall) {
        gatedAction(call, .adjustRemoveGlobalCallbackParameters) { Tapp.adjustRemoveGlobalCallbackParameters() }
    }

    @objc public func adjustRemoveGlobalPartnerParameters(_ call: CAPPluginCall) {
        gatedAction(call, .adjustRemoveGlobalPartnerParameters) { Tapp.adjustRemoveGlobalPartnerParameters() }
    }

    @objc public func adjustGetSdkVersion(_ call: CAPPluginCall) {
        gated(call, .adjustGetSdkVersion) { _ in
            Tapp.adjustSdkVersion(completion: { version in
                self.resolveOnMain(call, TappAdjustMapping.optionalString("version", version))
            })
        }
    }

    // MARK: - Adjust: iOS only

    @objc public func adjustVerifyAppStorePurchase(_ call: CAPPluginCall) {
        gated(call, .adjustVerifyAppStorePurchase) { read in
            guard let input = TappAdjustMapping.appStorePurchase(read) else {
                self.rejectInvalid(call, "transactionId and productId must be nonblank strings.")
                return
            }
            Tapp.adjustVerifyAppStorePurchase(
                transactionId: input.transactionId, productId: input.productId, completion: { result in
                    DispatchQueue.main.async {
                        guard let result else {
                            call.reject("Purchase verification returned no result.", "UNAVAILABLE")
                            return
                        }
                        call.resolve(TappAdjustMapping.verifyResult(
                            verificationStatus: result.verificationStatus, code: result.code, message: result.message
                        ))
                    }
                }
            )
        }
    }

    @objc public func adjustTrackAppStoreSubscription(_ call: CAPPluginCall) {
        gated(call, .adjustTrackAppStoreSubscription) { read in
            // Only price, currency, and transactionId are read. The JS number price is
            // converted to NSDecimalNumber through its shortest decimal string.
            guard let input = TappAdjustMapping.appStoreSubscription(read),
                  let subscription = AdjustAppStoreSubscription(
                    price: input.price, currency: input.currency, transactionId: input.transactionId
                  ) else {
                self.rejectInvalid(call, "price must be a finite number; currency and transactionId must be nonblank strings.")
                return
            }
            Tapp.adjustTrackAppStoreSubscription(subscription)
            call.resolve()
        }
    }

    @objc public func adjustConvert(_ call: CAPPluginCall) {
        gated(call, .adjustConvert) { read in
            guard let universalLink = TappAdjustMapping.parsedURL(read("universalLink") as? String) else {
                call.reject("universalLink must be a nonempty, valid URL.", "INVALID_URL")
                return
            }
            guard let scheme = TappAdjustMapping.nonBlankString(read("scheme")) else {
                self.rejectInvalid(call, "scheme must be a nonblank string.")
                return
            }
            let converted = Tapp.adjustConvert(universalLink: universalLink, with: scheme)
            call.resolve(TappAdjustMapping.optionalString("url", converted?.absoluteString))
        }
    }

    @objc public func adjustRequestAppTrackingAuthorization(_ call: CAPPluginCall) {
        gated(call, .adjustRequestAppTrackingAuthorization) { _ in
            Tapp.adjustRequestAppTrackingAuthorization(completionHandler: { status in
                self.resolveOnMain(call, TappAdjustMapping.requestedTrackingStatus(status))
            })
        }
    }

    @objc public func adjustAppTrackingAuthorizationStatus(_ call: CAPPluginCall) {
        gated(call, .adjustAppTrackingAuthorizationStatus) { _ in
            call.resolve(TappAdjustMapping.trackingStatus(Tapp.adjustAppTrackingAuthorizationStatus()))
        }
    }

    @objc public func adjustUpdateSkanConversionValue(_ call: CAPPluginCall) {
        gated(call, .adjustUpdateSkanConversionValue) { read in
            guard let input = TappAdjustMapping.skanConversionValue(read) else {
                self.rejectInvalid(call, "value must be an integer; coarseValue must be a nonblank string and lockWindow a number when present.")
                return
            }
            Tapp.adjustUpdateSkanConversionValue(
                input.value, coarseValue: input.coarseValue, lockWindow: input.lockWindow, completion: { error in
                    DispatchQueue.main.async {
                        if let error {
                            call.reject(error.localizedDescription, "SKAN_ERROR", error)
                        } else {
                            call.resolve()
                        }
                    }
                }
            )
        }
    }

    // MARK: - Adjust: Android only (always reject UNIMPLEMENTED at the platform gate)

    @objc public func adjustTrackPlayStoreSubscription(_ call: CAPPluginCall) {
        androidOnly(call, .adjustTrackPlayStoreSubscription)
    }

    @objc public func adjustVerifyPlayStorePurchase(_ call: CAPPluginCall) {
        androidOnly(call, .adjustVerifyPlayStorePurchase)
    }

    @objc public func adjustVerifyAndTrackPlayStorePurchase(_ call: CAPPluginCall) {
        androidOnly(call, .adjustVerifyAndTrackPlayStorePurchase)
    }

    @objc public func adjustGetGoogleAdId(_ call: CAPPluginCall) {
        androidOnly(call, .adjustGetGoogleAdId)
    }

    @objc public func adjustGetAmazonAdId(_ call: CAPPluginCall) {
        androidOnly(call, .adjustGetAmazonAdId)
    }

    @objc public func adjustGetGooglePlayInstallReferrer(_ call: CAPPluginCall) {
        androidOnly(call, .adjustGetGooglePlayInstallReferrer)
    }

    @objc public func adjustSetReferrer(_ call: CAPPluginCall) {
        androidOnly(call, .adjustSetReferrer)
    }
}

import Foundation
import CoreFoundation

// Foundation-only conversions and validation shared by the bridge and its tests.
enum TappAdjustMapping {
    // MARK: - Method registry and gates

    static let coreMethodNames = [
        "start", "url", "handleTappEvent", "shouldProcess", "fetchLinkData", "fetchOriginLinkData"
    ]

    /// Every TappAdjustPlugin method from definitions.ts beyond the core surface.
    enum Method: String, CaseIterable {
        // iOS and Android.
        case handleEvent, getAdjustAttribution, adjustGetAdid, adjustGetIdfa
        case adjustTrackAdRevenue, adjustSetPushToken, adjustGdprForgetMe
        case adjustTrackThirdPartySharing, adjustTrackMeasurementConsent
        case adjustEnable, adjustDisable, adjustIsEnabled
        case adjustSwitchToOfflineMode, adjustSwitchBackToOnlineMode
        case adjustAddGlobalCallbackParameter, adjustAddGlobalPartnerParameter
        case adjustRemoveGlobalCallbackParameter, adjustRemoveGlobalPartnerParameter
        case adjustRemoveGlobalCallbackParameters, adjustRemoveGlobalPartnerParameters
        case adjustGetSdkVersion
        // iOS only.
        case adjustVerifyAppStorePurchase, adjustTrackAppStoreSubscription, adjustConvert
        case adjustRequestAppTrackingAuthorization, adjustAppTrackingAuthorizationStatus
        case adjustUpdateSkanConversionValue
        // Android only: registered on iOS so they reject instead of hanging.
        case adjustTrackPlayStoreSubscription, adjustVerifyPlayStorePurchase
        case adjustVerifyAndTrackPlayStorePurchase, adjustGetGoogleAdId, adjustGetAmazonAdId
        case adjustGetGooglePlayInstallReferrer, adjustSetReferrer
    }

    static let androidOnlyMethods: Set<Method> = [
        .adjustTrackPlayStoreSubscription, .adjustVerifyPlayStorePurchase,
        .adjustVerifyAndTrackPlayStorePurchase, .adjustGetGoogleAdId, .adjustGetAmazonAdId,
        .adjustGetGooglePlayInstallReferrer, .adjustSetReferrer
    ]

    static var pluginMethodNames: [String] {
        coreMethodNames + Method.allCases.map(\.rawValue)
    }

    struct Rejection: Equatable {
        let code: String
        let message: String
    }

    static let notStartedMessage = "Tapp has not been started. Call start() first."

    /// Platform gate first (regardless of start state), then the start gate.
    static func gateRejection(for method: Method, started: Bool) -> Rejection? {
        if androidOnlyMethods.contains(method) {
            return Rejection(code: "UNIMPLEMENTED", message: "\(method.rawValue) is not available on iOS.")
        }
        if !started {
            return Rejection(code: "NOT_STARTED", message: notStartedMessage)
        }
        return nil
    }

    // MARK: - Input readers

    /// Reads one option value by key; the bridge passes `call.getValue`.
    typealias Reader = (String) -> Any?

    static func isAbsent(_ value: Any?) -> Bool {
        value == nil || value is NSNull
    }

    /// Returns the string unchanged when it contains a non-whitespace character.
    static func nonBlankString(_ value: Any?) -> String? {
        guard let string = value as? String,
              !string.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else { return nil }
        return string
    }

    /// Accepts only real booleans; Swift casts can treat NSNumber(1) as Bool.
    static func strictBool(_ value: Any?) -> Bool? {
        if let number = value as? NSNumber {
            return CFGetTypeID(number) == CFBooleanGetTypeID() ? number.boolValue : nil
        }
        return value as? Bool
    }

    /// Accepts finite numbers and rejects booleans.
    static func finiteNumber(_ value: Any?) -> Double? {
        guard !(value is Bool), let number = value as? NSNumber,
              CFGetTypeID(number) != CFBooleanGetTypeID() else { return nil }
        let double = number.doubleValue
        return double.isFinite ? double : nil
    }

    static func integer(_ value: Any?) -> Int? {
        guard let double = finiteNumber(value), double.rounded(.towardZero) == double else { return nil }
        return Int(exactly: double)
    }

    static func eventToken(_ read: Reader) -> String? {
        nonBlankString(read("eventToken"))
    }

    struct AdRevenue: Equatable {
        let source: String
        let revenue: Double
        let currency: String
    }

    static func adRevenue(_ read: Reader) -> AdRevenue? {
        guard let source = nonBlankString(read("source")),
              let revenue = finiteNumber(read("revenue")), revenue >= 0,
              let currency = nonBlankString(read("currency")) else { return nil }
        return AdRevenue(source: source, revenue: revenue, currency: currency)
    }

    /// JS sends {key, value}; the iOS adapter takes the value first: `(_ parameter:, key:)`.
    /// Returns false without calling `add` when either string is missing or blank.
    static func addGlobalParameter(_ read: Reader, using add: (_ parameter: String, _ key: String) -> Void) -> Bool {
        guard let key = nonBlankString(read("key")), let value = nonBlankString(read("value")) else {
            return false
        }
        add(value, key)
        return true
    }

    struct AppStorePurchase: Equatable {
        let transactionId: String
        let productId: String
    }

    static func appStorePurchase(_ read: Reader) -> AppStorePurchase? {
        guard let transactionId = nonBlankString(read("transactionId")),
              let productId = nonBlankString(read("productId")) else { return nil }
        return AppStorePurchase(transactionId: transactionId, productId: productId)
    }

    struct AppStoreSubscription: Equatable {
        let price: NSDecimalNumber
        let currency: String
        let transactionId: String
    }

    /// Reads only price, currency, and transactionId.
    static func appStoreSubscription(_ read: Reader) -> AppStoreSubscription? {
        guard let price = finiteNumber(read("price")).flatMap(decimalPrice),
              let currency = nonBlankString(read("currency")),
              let transactionId = nonBlankString(read("transactionId")) else { return nil }
        return AppStoreSubscription(price: price, currency: currency, transactionId: transactionId)
    }

    /// Converts through Swift's shortest round-trip decimal string (9.99 -> "9.99"), so the
    /// decimal matches the JS number literal instead of its binary expansion.
    static func decimalPrice(_ value: Double) -> NSDecimalNumber? {
        guard value.isFinite,
              let decimal = Decimal(string: "\(value)", locale: Locale(identifier: "en_US_POSIX")),
              !decimal.isNaN else { return nil }
        return NSDecimalNumber(decimal: decimal)
    }

    struct SkanConversionValue: Equatable {
        let value: Int
        let coarseValue: String?
        let lockWindow: NSNumber?
    }

    /// value must be an integer. coarseValue, when present, must be a nonblank string.
    /// lockWindow is typed as a number in definitions.ts; a finite number or a boolean is
    /// passed to the native SDK as NSNumber. null counts as absent for the optional fields.
    static func skanConversionValue(_ read: Reader) -> SkanConversionValue? {
        guard let value = integer(read("value")) else { return nil }
        var coarseValue: String?
        let rawCoarse = read("coarseValue")
        if !isAbsent(rawCoarse) {
            guard let string = nonBlankString(rawCoarse) else { return nil }
            coarseValue = string
        }
        var lockWindow: NSNumber?
        let rawLock = read("lockWindow")
        if !isAbsent(rawLock) {
            if let bool = strictBool(rawLock) {
                lockWindow = NSNumber(value: bool)
            } else if let number = finiteNumber(rawLock) {
                lockWindow = NSNumber(value: number)
            } else {
                return nil
            }
        }
        return SkanConversionValue(value: value, coarseValue: coarseValue, lockWindow: lockWindow)
    }

    // MARK: - Results

    /// Keys follow the JS AdjustAttribution type; the native adGroup property maps to "adgroup".
    static func attribution(
        trackerToken: String?, trackerName: String?, network: String?, campaign: String?,
        adGroup: String?, creative: String?, clickLabel: String?, costType: String?,
        costAmount: NSNumber?, costCurrency: String?
    ) -> [String: Any] {
        var result: [String: Any] = [:]
        if let trackerToken { result["trackerToken"] = trackerToken }
        if let trackerName { result["trackerName"] = trackerName }
        if let network { result["network"] = network }
        if let campaign { result["campaign"] = campaign }
        if let adGroup { result["adgroup"] = adGroup }
        if let creative { result["creative"] = creative }
        if let clickLabel { result["clickLabel"] = clickLabel }
        if let costType { result["costType"] = costType }
        if let costAmount, costAmount.doubleValue.isFinite { result["costAmount"] = costAmount.doubleValue }
        if let costCurrency { result["costCurrency"] = costCurrency }
        return result
    }

    /// A missing native attribution resolves as an empty object.
    static func attributionResult(_ attribution: [String: Any]?) -> [String: Any] {
        ["attribution": attribution ?? [:]]
    }

    /// Single optional string result; omitted when nil or empty.
    static func optionalString(_ key: String, _ value: String?) -> [String: Any] {
        guard let value, !value.isEmpty else { return [:] }
        return [key: value]
    }

    static func isEnabled(_ value: NSNumber) -> [String: Any] {
        ["isEnabled": value.boolValue]
    }

    static func trackingStatus(_ status: Int32) -> [String: Any] {
        ["status": Int(status)]
    }

    static func requestedTrackingStatus(_ status: NSNumber?) -> [String: Any] {
        guard let status else { return [:] }
        return ["status": status.intValue]
    }

    static func verifyResult(verificationStatus: String, code: Int32, message: String) -> [String: Any] {
        ["verificationStatus": verificationStatus, "code": Int(code), "message": message]
    }

    // MARK: - Core conversions (unchanged from tapp-capacitor-sdk)

    private static let eventNames = [
        "tapp_add_payment_info", "tapp_add_to_cart", "tapp_add_to_wishlist",
        "tapp_complete_registration", "tapp_contact", "tapp_customize_product",
        "tapp_donate", "tapp_find_location", "tapp_initiate_checkout",
        "tapp_generate_lead", "tapp_purchase", "tapp_schedule", "tapp_search",
        "tapp_start_trial", "tapp_submit_application", "tapp_subscribe",
        "tapp_view_content", "tapp_click_button", "tapp_download_file",
        "tapp_join_group", "tapp_achieve_level", "tapp_create_group",
        "tapp_create_role", "tapp_link_click", "tapp_link_impression",
        "tapp_apply_for_loan", "tapp_loan_approval", "tapp_loan_disbursal",
        "tapp_login", "tapp_rate", "tapp_spend_credits", "tapp_unlock_achievement",
        "tapp_add_shipping_info", "tapp_earn_virtual_currency", "tapp_start_level",
        "tapp_complete_level", "tapp_post_score", "tapp_select_content",
        "tapp_begin_tutorial", "tapp_complete_tutorial"
    ]

    static func eventName(action: Any?, customValue: String?) -> String? {
        guard let number = action as? NSNumber,
              CFGetTypeID(number) != CFBooleanGetTypeID() else { return nil }
        let value = number.doubleValue
        guard value.isFinite, value.rounded(.towardZero) == value,
              (0...40).contains(value) else { return nil }
        if value == 0 {
            return customValue.flatMap { $0.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty ? nil : $0 } ?? "custom_event_autogenerated"
        }
        return eventNames[Int(value) - 1]
    }

    static func metadata(_ input: [String: Any]?) -> [String: Encodable]? {
        guard let input else { return nil }
        var output: [String: Encodable] = [:]
        for (key, value) in input {
            if let string = value as? String {
                output[key] = string
            } else if let number = value as? NSNumber {
                // Swift casts can treat NSNumber(1) as Bool. Inspect the CF type first.
                if CFGetTypeID(number) == CFBooleanGetTypeID() {
                    output[key] = number.boolValue
                } else if number.doubleValue.isFinite {
                    output[key] = number.doubleValue
                }
            }
        }
        return output
    }

    static func stringData(_ input: [String: Any]?) -> [String: String]? {
        input?.compactMapValues { $0 as? String }
    }

    static func parsedURL(_ string: String?) -> URL? {
        guard let trimmed = string?.trimmingCharacters(in: .whitespacesAndNewlines),
              !trimmed.isEmpty,
              let url = URL(string: trimmed),
              let scheme = url.scheme, !scheme.isEmpty,
              !["javascript", "data", "file"].contains(scheme.lowercased()) else {
            return nil
        }
        return url
    }

    static func linkData(
        tappURL: URL?, attributedTappURL: URL?, influencer: String?,
        data: [String: String]?, isFirstSession: Bool?
    ) -> [String: Any] {
        var result: [String: Any] = ["error": false]
        if let tappURL { result["tappUrl"] = tappURL.absoluteString }
        if let attributedTappURL { result["attrTappUrl"] = attributedTappURL.absoluteString }
        if let influencer { result["influencer"] = influencer }
        if let data { result["data"] = data }
        if let isFirstSession { result["isFirstSession"] = isFirstSession }
        return result
    }

    static func failure(message: String) -> [String: Any] {
        ["error": true, "message": message]
    }
}

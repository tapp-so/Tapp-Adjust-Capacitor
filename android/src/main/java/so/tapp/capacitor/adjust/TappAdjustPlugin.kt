package so.tapp.capacitor.adjust

import androidx.lifecycle.Lifecycle
import androidx.lifecycle.LifecycleOwner
import com.adjust.sdk.AdjustAttribution
import com.adjust.sdk.AdjustEvent
import com.adjust.sdk.AdjustPlayStorePurchase
import com.adjust.sdk.AdjustPurchaseVerificationResult
import com.adjust.sdk.GooglePlayInstallReferrerDetails
import com.adjust.sdk.OnGooglePlayInstallReferrerReadListener
import com.adjust.sdk.OnPurchaseVerificationFinishedListener
import com.example.tapp.Tapp
import com.example.tapp.models.Affiliate
import com.example.tapp.models.Environment
import com.example.tapp.services.affiliate.tapp.DeferredLinkDelegate
import com.example.tapp.services.network.RequestModels
import com.example.tapp.utils.TappConfiguration
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.launch
import org.json.JSONObject

@CapacitorPlugin(name = "Tapp")
class TappAdjustPlugin : Plugin() {
    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.IO)
    private var tapp: Tapp? = null
    @Volatile private var started = false
    // Main thread only: whether the current Activity resume was already forwarded to Adjust.
    private var resumeForwarded = false
    @Volatile private var destroyed = false

    private val delegate = object : DeferredLinkDelegate {
        override fun didReceiveDeferredLink(linkDataResponse: RequestModels.TappLinkDataResponse) {
            emit("deferredLinkReceived", TappAdjustMapping.linkData(linkDataResponse))
        }

        override fun didFailResolvingUrl(response: RequestModels.FailResolvingUrlResponse) {
            emit("didFailResolvingURL", mapOf("url" to response.url, "error" to response.error))
        }

        override fun testListener(test: String) = Unit
    }

    @PluginMethod
    fun start(call: PluginCall) {
        if (started) {
            call.resolve()
            return
        }
        val authToken = string(call, "authToken")
        val tappToken = string(call, "tappToken")
        val environment = when (string(call, "env")) {
            "PRODUCTION" -> Environment.PRODUCTION
            "SANDBOX" -> Environment.SANDBOX
            else -> null
        }
        if (authToken.isNullOrBlank() || tappToken.isNullOrBlank() || environment == null) {
            call.reject("Nonempty authToken and tappToken and env PRODUCTION or SANDBOX are required.", "INVALID_ARGUMENT")
            return
        }
        try {
            val sdk = instance()
            sdk.deferredLinkDelegate = delegate
            sdk.start(TappConfiguration(authToken, environment, tappToken, Affiliate.ADJUST))
            started = true
            call.resolve()
            forwardInitialResume()
        } catch (_: Exception) {
            // Do not expose configuration or credentials from native exception messages.
            call.reject("Unable to start Tapp.", "START_ERROR")
        }
    }

    @PluginMethod
    fun url(call: PluginCall) {
        val sdk = requireStarted(call) ?: return
        val influencer = string(call, "influencer")
        if (influencer.isNullOrBlank()) {
            call.reject("A nonempty influencer is required.", "INVALID_ARGUMENT")
            return
        }
        val adGroup = string(call, "adGroup")
        val creative = string(call, "creative")
        val data = TappAdjustMapping.stringData(objectMap(call.data.optJSONObject("data")))
        scope.launch {
            try {
                val result = sdk.url(influencer, adGroup, creative, data)
                if (result.error) {
                    call.reject(result.message.ifBlank { "Unable to generate Tapp URL." }, "URL_ERROR")
                } else if (result.influencer_url.isBlank()) {
                    call.reject("No Tapp URL returned.", "URL_ERROR")
                } else {
                    call.resolve(jsObject(mapOf("url" to result.influencer_url)))
                }
            } catch (cancelled: CancellationException) {
                throw cancelled
            } catch (_: Exception) {
                call.reject("Unable to generate Tapp URL.", "URL_ERROR")
            }
        }
    }

    @PluginMethod
    fun handleTappEvent(call: PluginCall) {
        val sdk = requireStarted(call) ?: return
        val action = TappAdjustMapping.eventAction(call.data.opt("eventAction"), string(call, "customValue"))
        if (action == null) {
            call.reject("eventAction must be an integer from 0 through 40.", "INVALID_ARGUMENT")
            return
        }
        val metadata = TappAdjustMapping.metadata(objectMap(call.data.optJSONObject("metadata")))
        try {
            sdk.handleTappEvent(RequestModels.TappEvent(eventName = action, metadata = metadata))
            call.resolve()
        } catch (_: Exception) {
            call.reject("Unable to handle Tapp event.", "HANDLE_EVENT_ERROR")
        }
    }

    @PluginMethod
    fun shouldProcess(call: PluginCall) {
        val url = requiredUrl(call) ?: return
        try {
            call.resolve(jsObject(mapOf("value" to instance().shouldProcess(url))))
        } catch (_: Exception) {
            call.resolve(jsObject(mapOf("value" to false)))
        }
    }

    @PluginMethod
    fun fetchLinkData(call: PluginCall) {
        val url = requiredUrl(call) ?: return
        val sdk = startedForLinkData(call) ?: return
        fetch(call) { sdk.fetchLinkData(url) }
    }

    @PluginMethod
    fun fetchOriginLinkData(call: PluginCall) {
        val sdk = startedForLinkData(call) ?: return
        fetch(call) { sdk.fetchOriginalLinkData() }
    }

    private fun fetch(call: PluginCall, request: suspend () -> RequestModels.TappLinkDataResponse?) {
        scope.launch {
            try {
                call.resolve(jsObject(TappAdjustMapping.linkData(request())))
            } catch (cancelled: CancellationException) {
                throw cancelled
            } catch (error: Exception) {
                call.resolve(jsObject(TappAdjustMapping.error(error.message)))
            }
        }
    }

    private fun instance(): Tapp = tapp ?: Tapp(context.applicationContext).also { tapp = it }

    private fun requireStarted(call: PluginCall): Tapp? {
        if (started) return tapp
        call.reject(TappAdjustMapping.NOT_STARTED, "NOT_STARTED")
        return null
    }

    private fun startedForLinkData(call: PluginCall): Tapp? {
        if (started) return tapp
        call.resolve(jsObject(TappAdjustMapping.error(TappAdjustMapping.NOT_STARTED)))
        return null
    }

    private fun requiredUrl(call: PluginCall): String? {
        val url = TappAdjustMapping.parsedUrl(string(call, "url"))
        if (url != null) return url
        call.reject("url must be a nonempty, valid URL.", "INVALID_URL")
        return null
    }

    private fun string(call: PluginCall, key: String): String? = call.data.opt(key) as? String

    private fun objectMap(value: JSONObject?): Map<String, Any?>? = value?.let {
        buildMap {
            val keys = it.keys()
            while (keys.hasNext()) {
                val key = keys.next()
                put(key, it.opt(key))
            }
        }
    }

    private fun jsObject(values: Map<String, *>): JSObject = JSObject().apply {
        values.forEach { (key, value) ->
            // Explicitly wrap nested data so the bridge emits a JSON object.
            put(key, if (value is Map<*, *>) JSONObject(value) else value)
        }
    }

    private fun emit(name: String, payload: Map<String, Any>) {
        if (destroyed) return
        // Serialize event delivery with Capacitor's listener registration.
        bridge.execute {
            if (!destroyed) notifyListeners(name, jsObject(payload), true)
        }
    }

    // --- Adjust adapter. Order: platform gate, NOT_STARTED, INVALID_ARGUMENT, native call. ---

    @PluginMethod
    fun handleEvent(call: PluginCall) {
        val sdk = adjustGate(call) ?: return
        val eventToken = requiredString(call, "eventToken") ?: return
        try {
            sdk.handleEvent(eventToken)
            call.resolve()
        } catch (_: Exception) {
            // Never echo native text: it could contain the event token or configuration.
            call.reject("Unable to handle Adjust event.", "HANDLE_EVENT_ERROR")
        }
    }

    @PluginMethod
    fun getAdjustAttribution(call: PluginCall) {
        val sdk = adjustGate(call) ?: return
        val once = TappAdjustMapping.Once()
        native(call, once) {
            sdk.getAdjustAttribution { attribution ->
                if (once.claim()) call.resolve(jsObject(mapOf("attribution" to attribution(attribution))))
            }
        }
    }

    @PluginMethod
    fun adjustGetAdid(call: PluginCall) {
        val sdk = adjustGate(call) ?: return
        val once = TappAdjustMapping.Once()
        native(call, once) { sdk.adjustGetAdid { if (once.claim()) resolveField(call, "adid", it) } }
    }

    @PluginMethod
    fun adjustGetIdfa(call: PluginCall) {
        val sdk = adjustGate(call) ?: return
        val once = TappAdjustMapping.Once()
        native(call, once) { sdk.adjustGetIdfa { if (once.claim()) resolveField(call, "idfa", it) } }
    }

    @PluginMethod
    fun adjustTrackAdRevenue(call: PluginCall) {
        val sdk = adjustGate(call) ?: return
        val revenue = TappAdjustMapping.adRevenue(call.data.opt("source"), call.data.opt("revenue"), call.data.opt("currency"))
        if (revenue == null) {
            call.reject("Nonempty source and currency and a finite, non-negative revenue are required.", "INVALID_ARGUMENT")
            return
        }
        nativeVoid(call) { sdk.adjustTrackAdRevenue(revenue.source, revenue.revenue, revenue.currency) }
    }

    @PluginMethod
    fun adjustSetPushToken(call: PluginCall) {
        val sdk = adjustGate(call) ?: return
        val token = requiredString(call, "token") ?: return
        nativeVoid(call) { sdk.adjustSetPushToken(token) }
    }

    @PluginMethod
    fun adjustGdprForgetMe(call: PluginCall) {
        val sdk = adjustGate(call) ?: return
        nativeVoid(call) { sdk.adjustGdprForgetMe() }
    }

    @PluginMethod
    fun adjustTrackThirdPartySharing(call: PluginCall) {
        val sdk = adjustGate(call) ?: return
        val enabled = requiredBoolean(call, "enabled") ?: return
        nativeVoid(call) { sdk.adjustTrackThirdPartySharing(enabled) }
    }

    @PluginMethod
    fun adjustTrackMeasurementConsent(call: PluginCall) {
        val sdk = adjustGate(call) ?: return
        val consent = requiredBoolean(call, "consent") ?: return
        nativeVoid(call) { sdk.adjustTrackMeasurementConsent(consent) }
    }

    @PluginMethod
    fun adjustEnable(call: PluginCall) {
        val sdk = adjustGate(call) ?: return
        nativeVoid(call) { sdk.adjustEnable() }
    }

    @PluginMethod
    fun adjustDisable(call: PluginCall) {
        val sdk = adjustGate(call) ?: return
        nativeVoid(call) { sdk.adjustDisable() }
    }

    @PluginMethod
    fun adjustIsEnabled(call: PluginCall) {
        val sdk = adjustGate(call) ?: return
        val once = TappAdjustMapping.Once()
        native(call, once) {
            sdk.adjustIsEnabled(context.applicationContext) { isEnabled ->
                if (once.claim()) call.resolve(jsObject(mapOf("isEnabled" to isEnabled)))
            }
        }
    }

    @PluginMethod
    fun adjustSwitchToOfflineMode(call: PluginCall) {
        val sdk = adjustGate(call) ?: return
        nativeVoid(call) { sdk.adjustSwitchToOfflineMode() }
    }

    @PluginMethod
    fun adjustSwitchBackToOnlineMode(call: PluginCall) {
        val sdk = adjustGate(call) ?: return
        nativeVoid(call) { sdk.adjustSwitchBackToOnlineMode() }
    }

    @PluginMethod
    fun adjustAddGlobalCallbackParameter(call: PluginCall) {
        val sdk = adjustGate(call) ?: return
        val args = globalParameter(call) ?: return
        nativeVoid(call) { sdk.adjustAddGlobalCallbackParameter(args.first, args.second) }
    }

    @PluginMethod
    fun adjustAddGlobalPartnerParameter(call: PluginCall) {
        val sdk = adjustGate(call) ?: return
        val args = globalParameter(call) ?: return
        nativeVoid(call) { sdk.adjustAddGlobalPartnerParameter(args.first, args.second) }
    }

    @PluginMethod
    fun adjustRemoveGlobalCallbackParameter(call: PluginCall) {
        val sdk = adjustGate(call) ?: return
        val key = requiredString(call, "key") ?: return
        nativeVoid(call) { sdk.adjustRemoveGlobalCallbackParameter(key) }
    }

    @PluginMethod
    fun adjustRemoveGlobalPartnerParameter(call: PluginCall) {
        val sdk = adjustGate(call) ?: return
        val key = requiredString(call, "key") ?: return
        nativeVoid(call) { sdk.adjustRemoveGlobalPartnerParameter(key) }
    }

    @PluginMethod
    fun adjustRemoveGlobalCallbackParameters(call: PluginCall) {
        val sdk = adjustGate(call) ?: return
        nativeVoid(call) { sdk.adjustRemoveGlobalCallbackParameters() }
    }

    @PluginMethod
    fun adjustRemoveGlobalPartnerParameters(call: PluginCall) {
        val sdk = adjustGate(call) ?: return
        nativeVoid(call) { sdk.adjustRemoveGlobalPartnerParameters() }
    }

    @PluginMethod
    fun adjustGetSdkVersion(call: PluginCall) {
        val sdk = adjustGate(call) ?: return
        val once = TappAdjustMapping.Once()
        native(call, once) { sdk.adjustGetSdkVersion { if (once.claim()) resolveField(call, "version", it) } }
    }

    // iOS-only methods: adjustGate always rejects them with UNIMPLEMENTED, so they never hang.

    @PluginMethod
    fun adjustVerifyAppStorePurchase(call: PluginCall) {
        adjustGate(call)
    }

    @PluginMethod
    fun adjustTrackAppStoreSubscription(call: PluginCall) {
        adjustGate(call)
    }

    @PluginMethod
    fun adjustConvert(call: PluginCall) {
        adjustGate(call)
    }

    @PluginMethod
    fun adjustRequestAppTrackingAuthorization(call: PluginCall) {
        adjustGate(call)
    }

    @PluginMethod
    fun adjustAppTrackingAuthorizationStatus(call: PluginCall) {
        adjustGate(call)
    }

    @PluginMethod
    fun adjustUpdateSkanConversionValue(call: PluginCall) {
        adjustGate(call)
    }

    // Android-only methods.

    @PluginMethod
    fun adjustTrackPlayStoreSubscription(call: PluginCall) {
        val sdk = adjustGate(call) ?: return
        val data = call.data
        val subscription = TappAdjustMapping.playStoreSubscription(
            data.opt("price"), data.opt("currency"), data.opt("sku"), data.opt("orderId"),
            data.opt("signature"), data.opt("purchaseToken"), data.opt("purchaseTime")
        )
        if (subscription == null) {
            call.reject(
                "A finite price, optional finite purchaseTime, and nonempty currency, sku, orderId, " +
                    "signature, and purchaseToken are required.",
                "INVALID_ARGUMENT"
            )
            return
        }
        nativeVoid(call) {
            sdk.adjustTrackPlayStoreSubscription(
                subscription.price, subscription.currency, subscription.sku, subscription.orderId,
                subscription.signature, subscription.purchaseToken, subscription.purchaseTime
            )
        }
    }

    @PluginMethod
    fun adjustVerifyPlayStorePurchase(call: PluginCall) {
        val sdk = adjustGate(call) ?: return
        val transactionId = TappAdjustMapping.nonBlank(call.data.opt("transactionId"))
        val productId = TappAdjustMapping.nonBlank(call.data.opt("productId"))
        if (transactionId == null || productId == null) {
            call.reject("Nonempty transactionId and productId are required.", "INVALID_ARGUMENT")
            return
        }
        // AdjustPlayStorePurchase(productId, purchaseToken); JS transactionId is the purchase token.
        val args = TappAdjustMapping.playStorePurchaseArgs(transactionId, productId)
        val purchase = AdjustPlayStorePurchase(args.first, args.second)
        val once = TappAdjustMapping.Once()
        val listener = verificationListener(call, once)
        native(call, once) { sdk.verifyPlayStorePurchase(purchase, listener) }
    }

    @PluginMethod
    fun adjustVerifyAndTrackPlayStorePurchase(call: PluginCall) {
        val sdk = adjustGate(call) ?: return
        val eventToken = requiredString(call, "eventToken") ?: return
        val once = TappAdjustMapping.Once()
        val listener = verificationListener(call, once)
        native(call, once) { sdk.adjustVerifyAndTrackPlayStorePurchase(AdjustEvent(eventToken), listener) }
    }

    @PluginMethod
    fun adjustGetGoogleAdId(call: PluginCall) {
        val sdk = adjustGate(call) ?: return
        val once = TappAdjustMapping.Once()
        native(call, once) { sdk.adjustGetGoogleAdId { if (once.claim()) resolveField(call, "googleAdId", it) } }
    }

    @PluginMethod
    fun adjustGetAmazonAdId(call: PluginCall) {
        val sdk = adjustGate(call) ?: return
        val once = TappAdjustMapping.Once()
        native(call, once) { sdk.adjustGetAmazonAdId { if (once.claim()) resolveField(call, "amazonAdId", it) } }
    }

    @PluginMethod
    fun adjustGetGooglePlayInstallReferrer(call: PluginCall) {
        val sdk = adjustGate(call) ?: return
        val once = TappAdjustMapping.Once()
        val listener = object : OnGooglePlayInstallReferrerReadListener {
            override fun onInstallReferrerRead(details: GooglePlayInstallReferrerDetails?) {
                if (!once.claim()) return
                // Typed subset only; never the raw details object or its toString().
                call.resolve(jsObject(TappAdjustMapping.installReferrer(
                    details?.installReferrer,
                    details?.referrerClickTimestampSeconds ?: 0L,
                    details?.installBeginTimestampSeconds ?: 0L
                )))
            }

            override fun onFail(message: String?) {
                // Generic message: native failure text could contain referrer data.
                if (once.claim()) call.reject("Unable to read the Google Play install referrer.", "INSTALL_REFERRER_ERROR")
            }
        }
        native(call, once) { sdk.adjustGetGooglePlayInstallReferrer(listener) }
    }

    @PluginMethod
    fun adjustSetReferrer(call: PluginCall) {
        val sdk = adjustGate(call) ?: return
        val referrer = requiredString(call, "referrer") ?: return
        nativeVoid(call) { sdk.adjustSetReferrer(referrer) }
    }

    private fun adjustGate(call: PluginCall): Tapp? {
        val method = call.methodName
        return when (TappAdjustMapping.gate(method, started)) {
            TappAdjustMapping.Gate.UNIMPLEMENTED -> {
                call.reject(TappAdjustMapping.unimplementedMessage(method), "UNIMPLEMENTED")
                null
            }
            TappAdjustMapping.Gate.NOT_STARTED -> {
                call.reject(TappAdjustMapping.NOT_STARTED, "NOT_STARTED")
                null
            }
            TappAdjustMapping.Gate.PROCEED -> tapp ?: run {
                call.reject(TappAdjustMapping.NOT_STARTED, "NOT_STARTED")
                null
            }
        }
    }

    private fun requiredString(call: PluginCall, key: String): String? {
        TappAdjustMapping.nonBlank(call.data.opt(key))?.let { return it }
        call.reject("A nonempty $key is required.", "INVALID_ARGUMENT")
        return null
    }

    private fun requiredBoolean(call: PluginCall, key: String): Boolean? {
        TappAdjustMapping.bool(call.data.opt(key))?.let { return it }
        call.reject("$key must be a boolean.", "INVALID_ARGUMENT")
        return null
    }

    private fun globalParameter(call: PluginCall): TappAdjustMapping.NativeArgs? {
        val key = TappAdjustMapping.nonBlank(call.data.opt("key"))
        val value = TappAdjustMapping.nonBlank(call.data.opt("value"))
        if (key == null || value == null) {
            call.reject("Nonempty key and value are required.", "INVALID_ARGUMENT")
            return null
        }
        return TappAdjustMapping.globalParameterArgs(key, value)
    }

    private fun attribution(value: AdjustAttribution?): Map<String, Any> =
        if (value == null) emptyMap() else TappAdjustMapping.attribution(
            trackerToken = value.trackerToken, trackerName = value.trackerName, network = value.network,
            campaign = value.campaign, adgroup = value.adgroup, creative = value.creative,
            clickLabel = value.clickLabel, costType = value.costType, costAmount = value.costAmount,
            costCurrency = value.costCurrency, fbInstallReferrer = value.fbInstallReferrer
        )

    private fun verificationListener(call: PluginCall, once: TappAdjustMapping.Once): OnPurchaseVerificationFinishedListener {
        return OnPurchaseVerificationFinishedListener { result: AdjustPurchaseVerificationResult? ->
            if (!once.claim()) return@OnPurchaseVerificationFinishedListener
            val mapped = result?.let { TappAdjustMapping.verifyResult(it.verificationStatus, it.code, it.message) }
            if (mapped == null) {
                call.reject("The Adjust SDK returned no verification result.", "UNAVAILABLE")
            } else {
                call.resolve(jsObject(mapped))
            }
        }
    }

    private fun resolveField(call: PluginCall, key: String, value: String?) {
        call.resolve(jsObject(TappAdjustMapping.optionalField(key, value)))
    }

    /** Fire-and-forget native call: resolves after the call returns. */
    private fun nativeVoid(call: PluginCall, block: () -> Unit) {
        try {
            block()
            call.resolve()
        } catch (_: Exception) {
            call.reject(TappAdjustMapping.ADJUST_FAILED, "UNAVAILABLE")
        }
    }

    /** Callback-based native call: the callback settles the call; a synchronous throw rejects it once. */
    private fun native(call: PluginCall, once: TappAdjustMapping.Once, block: () -> Unit) {
        try {
            block()
        } catch (_: Exception) {
            if (once.claim()) call.reject(TappAdjustMapping.ADJUST_FAILED, "UNAVAILABLE")
        }
    }

    // --- Lifecycle forwarding (Adjust needs onResume/onPause for session tracking). ---

    /** Runs on the main thread after the first successful start(); handleOnResume covers later resumes. */
    private fun forwardInitialResume() {
        try {
            val host = activity ?: return
            host.runOnUiThread {
                if (destroyed) return@runOnUiThread
                val resumed = (host as? LifecycleOwner)?.lifecycle?.currentState
                    ?.isAtLeast(Lifecycle.State.RESUMED) == true
                if (TappAdjustMapping.shouldForwardInitialResume(started, resumed, resumeForwarded)) {
                    resumeForwarded = true
                    forward { it.adjustOnResume() }
                }
            }
        } catch (_: Exception) {
            // Lifecycle forwarding must never fail start().
        }
    }

    private fun forward(block: (Tapp) -> Unit) {
        try {
            tapp?.let(block)
        } catch (_: Exception) {
        }
    }

    override fun handleOnResume() {
        super.handleOnResume()
        if (!TappAdjustMapping.shouldForwardLifecycle(started)) return
        resumeForwarded = true
        forward { it.adjustOnResume() }
    }

    override fun handleOnPause() {
        super.handleOnPause()
        resumeForwarded = false
        if (!TappAdjustMapping.shouldForwardLifecycle(started)) return
        forward { it.adjustOnPause() }
    }

    override fun handleOnDestroy() {
        destroyed = true
        tapp?.deferredLinkDelegate = null
        scope.cancel()
        started = false
        tapp = null
        super.handleOnDestroy()
    }
}

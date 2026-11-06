// swift-tools-version: 5.9
// The package and product name must stay TappAdjustCapacitorSdk because the Capacitor CLI derives it from the npm name.
import PackageDescription
import Foundation

let package = Package(
    name: "TappAdjustCapacitorSdk",
    platforms: [.iOS(.v15)],
    products: [
        .library(name: "TappAdjustCapacitorSdk", targets: ["TappAdjustCapacitorPlugin"])
    ],
    dependencies: [
        .package(url: "https://github.com/ionic-team/capacitor-swift-pm.git", "6.0.0"..<"9.0.0"),
        .package(url: "https://github.com/tapp-so/Tapp-iOS.git", exact: "1.1.23"),
        .package(url: "https://github.com/tapp-so/Tapp-Networking-iOS.git", exact: "1.1.7"),
        .package(url: "https://github.com/tapp-so/Tapp-Adjust-iOS.git", exact: "1.1.26")
    ],
    targets: [
        .target(
            name: "TappAdjustCapacitorPlugin",
            dependencies: [
                .product(name: "Capacitor", package: "capacitor-swift-pm"),
                // Capacitor's public headers import the Cordova module, so it must be linked.
                .product(name: "Cordova", package: "capacitor-swift-pm"),
                .product(name: "Tapp", package: "Tapp-iOS"),
                .product(name: "TappNetworking", package: "Tapp-Networking-iOS"),
                .product(name: "TappAdjust", package: "Tapp-Adjust-iOS")
            ],
            path: "ios/Sources/TappAdjustCapacitorPlugin",
            resources: [.copy("PrivacyInfo.xcprivacy")]
        )
    ] + (FileManager.default.fileExists(
        atPath: Context.packageDirectory + "/ios/Tests/TappAdjustCapacitorPluginTests"
    ) ? [
        .testTarget(
            name: "TappAdjustCapacitorPluginTests",
            dependencies: ["TappAdjustCapacitorPlugin"],
            path: "ios/Tests/TappAdjustCapacitorPluginTests"
        )
    ] : [])
)

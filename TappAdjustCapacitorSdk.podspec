require 'json'

# The package and product name must stay TappAdjustCapacitorSdk because the Capacitor CLI derives it from the npm name.
package = JSON.parse(File.read(File.join(__dir__, 'package.json')))

Pod::Spec.new do |s|
  s.name = 'TappAdjustCapacitorSdk'
  s.version = package['version']
  s.summary = package['description']
  s.license = package['license']
  s.homepage = package['homepage'] || package['repository']['url']
  s.author = package['author']
  s.source = { :git => package['repository']['url'], :tag => s.version.to_s }
  s.source_files = 'ios/Sources/**/*.{swift}'
  s.resource_bundles = { 'TappAdjustCapacitorSdkPrivacy' => ['ios/Sources/TappAdjustCapacitorPlugin/PrivacyInfo.xcprivacy'] }
  s.ios.deployment_target = '15.0'
  s.dependency 'Capacitor'
  s.dependency 'Tapp', '= 1.1.24'
  s.dependency 'Tapp-Adjust', '= 1.1.27'
  s.dependency 'Adjust', '= 5.0.1'
  s.dependency 'Tapp-Networking', '= 1.1.7'
  s.swift_version = '5.9'
end

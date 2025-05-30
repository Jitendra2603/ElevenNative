import UIKit
import React
import React_RCTAppDelegate
import ReactAppDependencyProvider

// PCMPlayer – lightweight AVAudioEngine-based PCM streaming player registered as a Native Module.
#if canImport(AVFoundation)
//import AVFoundation // No longer needed here
#endif

class AppDelegate: UIResponder, UIApplicationDelegate {
  var window: UIWindow?

  var reactNativeDelegate: ReactNativeDelegate?
  var reactNativeFactory: RCTReactNativeFactory?

  func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
  ) -> Bool {
    NSLog("[AppDelegate.swift] Application didFinishLaunchingWithOptions CALLED")

    let delegate = ReactNativeDelegate()
    let factory = RCTReactNativeFactory(delegate: delegate)
    delegate.dependencyProvider = RCTAppDependencyProvider()

    reactNativeDelegate = delegate
    reactNativeFactory = factory

    window = UIWindow(frame: UIScreen.main.bounds)

    factory.startReactNative(
      withModuleName: "ElevenNative",
      in: window,
      launchOptions: launchOptions
    )

    return true
  }
}

class ReactNativeDelegate: RCTDefaultReactNativeFactoryDelegate {
  override func sourceURL(for bridge: RCTBridge) -> URL? {
    self.bundleURL()
  }

  override func bundleURL() -> URL? {
#if DEBUG
    // To manually specify your Mac's IP address for the Metro bundler:
    // 1. Replace YOUR_MAC_IP_ADDRESS_HERE with your Mac's actual IP address on your Wi-Fi network.
    // 2. Uncomment the line below.
    return URL(string: "http://192.168.29.206:8081/index.bundle?platform=ios&dev=true&minify=false&inlineSourceMap=true")

    // Original line (comment out if using manual IP):
    // return RCTBundleURLProvider.sharedSettings().jsBundleURL(forBundleRoot: "index")
#else
    return Bundle.main.url(forResource: "main", withExtension: "jsbundle")
#endif
  }
}

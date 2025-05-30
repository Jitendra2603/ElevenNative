#import <React/RCTBridgeModule.h>
#import <React/RCTViewManager.h>

// Expose the Swift PCMPlayer class to React Native.
// This file must be listed in the iOS target so the module is registered.

@interface RCT_EXTERN_MODULE(PCMPlayer, NSObject)
RCT_EXTERN_METHOD(setup:(nonnull NSNumber *)sampleRate channels:(nonnull NSNumber *)channels)
RCT_EXTERN_METHOD(write:(NSString *)base64)
RCT_EXTERN_METHOD(stop)
@end 
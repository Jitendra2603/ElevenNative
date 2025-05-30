#import <React/RCTBridgeModule.h>

// Expose the PCMPlayer Swift module to React Native
@interface RCT_EXTERN_MODULE(PCMPlayer, NSObject)

// Expose the setup method. Note the colons for arguments.
// The types (NSNumber) must match what Swift expects.
RCT_EXTERN_METHOD(setup:(NSNumber *)sampleRate channels:(NSNumber *)channels)

// Expose the write method
RCT_EXTERN_METHOD(write:(NSString *)base64)

// Expose the stop method
RCT_EXTERN_METHOD(stop)

@end 
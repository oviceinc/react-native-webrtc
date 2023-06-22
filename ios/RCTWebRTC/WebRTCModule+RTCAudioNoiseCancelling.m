//
//  WebRTCModule+RTCAudioNoiseCancelling.m
//  RCTWebRTC
//
//  Created by Hiroki Okamoto on 2023/06/20.
//

#import "WebRTCModule+RTCAudioNoiseCancelling.h"

@implementation WebRTCModule (RTCAudioNoiseCancelling)

RCT_EXPORT_METHOD(createNCSession) {
    [AudioProcessor createAudioNoiseCancellingSession];
}

RCT_EXPORT_METHOD(closeNCSession) {
    [AudioProcessor closeAudioNoiseCancellingSession];
}

RCT_EXPORT_METHOD(enableNC : (BOOL)enabled) {
    [AudioProcessor enableAudioFilter:enabled];
}

@end

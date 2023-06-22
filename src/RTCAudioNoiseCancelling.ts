import { NativeModules } from 'react-native';
const { WebRTCModule } = NativeModules;

class RTCAudioNoiseCancelling {
    createNCSession(): number {
        return WebRTCModule.createNCSession();
    }

    closeNCSession(): number {
        return WebRTCModule.closeNCSession();
    }

    enableNC(isEnabled: boolean): number {
        return WebRTCModule.enableNC(isEnabled);
    }
}
export default new RTCAudioNoiseCancelling();

import {NativeModules} from 'react-native';

const {PCMPlayer} = NativeModules;

if (!PCMPlayer) {
  console.error('[PCMPlayer.ts] Native module PCMPlayer not found. Make sure it is linked correctly.');
}

export default {
  init(sampleRate = 16000, channels = 1) {
    if (PCMPlayer) {
      console.log('[PCMPlayer.ts] Calling native setup()');
      PCMPlayer.setup(sampleRate, channels);
    } else {
      console.error('[PCMPlayer.ts] Cannot call setup(), native module not available.');
    }
  },
  write(b64: string) {
    if (PCMPlayer) {
      console.log('[PCMPlayer.ts] Calling native write() with data:', b64.substring(0, 30) + '...');
      PCMPlayer.write(b64);
    } else {
      console.error('[PCMPlayer.ts] Cannot call write(), native module not available.');
    }
  },
  stop() {
    if (PCMPlayer) {
      console.log('[PCMPlayer.ts] Calling native stop()');
      PCMPlayer.stop();
    } else {
      console.error('[PCMPlayer.ts] Cannot call stop(), native module not available.');
    }
  },
}; 
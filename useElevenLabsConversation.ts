import {useCallback, useEffect, useRef, useState} from 'react';
import {PermissionsAndroid, Platform} from 'react-native';
import LiveAudioStream from 'react-native-live-audio-stream';
import PCMPlayer from './PCMPlayer';

/**
 * Hook for managing a bidirectional streaming conversation with an ElevenLabs agent.
 * Optimised for iOS.  Captures microphone PCM (16-bit, 16 kHz, mono) and sends it over
 * WebSocket using the ElevenLabs Conversational AI protocol.  Incoming PCM audio
 * from the agent is streamed straight into a native `PcmAudio` output session so that
 * we never touch the file-system.
 */
export default function useElevenLabsConversation({
  /** Either public agentId or a pre-signed URL */
  agentId,
  signedUrl,
  onTranscript,
  onAgentResponse,
}: {
  agentId?: string;
  signedUrl?: string;
  onTranscript?: (text: string) => void;
  onAgentResponse?: (text: string) => void;
}) {
  const [connected, setConnected] = useState(false);
  const socketRef = useRef<WebSocket | null>(null);
  const pcmSessionIdRef = useRef<number | null>(null);

  /**
   * Build an iOS PCM playback session lazily the first time we receive audio.
   */
  const ensurePlaybackSession = useCallback(() => {
    if (pcmSessionIdRef.current != null) {
      return;
    }
    console.log('[useElevenLabsConversation] ensurePlaybackSession called');
    try {
      console.log('[useElevenLabsConversation] Initializing PCMPlayer...');
      PCMPlayer.init(16000, 1);
      pcmSessionIdRef.current = 1;
      console.log('[useElevenLabsConversation] PCMPlayer initialized.');
    } catch (e) {
      console.warn('[ElevenLabs] PCMPlayer native module not available or init failed', e);
    }
  }, []);

  const stopPlaybackSession = useCallback(() => {
    if (pcmSessionIdRef.current == null) {
      return;
    }
    console.log('[useElevenLabsConversation] stopPlaybackSession called');
    try {
      console.log('[useElevenLabsConversation] Stopping PCMPlayer...');
      PCMPlayer.stop();
      console.log('[useElevenLabsConversation] PCMPlayer stopped.');
    } catch (e) {
      console.warn('[ElevenLabs] PCMPlayer stop failed', e);
    }
    pcmSessionIdRef.current = null;
  }, []);

  /**
   * Ask for mic permissions on Android (iOS handled by Info.plist prompt).
   */
  const requestMicPermission = useCallback(async () => {
    if (Platform.OS !== 'android') {
      return true;
    }
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
    );
    return granted === PermissionsAndroid.RESULTS.GRANTED;
  }, []);

  const start = useCallback(async () => {
    if (connected) {
      return;
    }
    const micOk = await requestMicPermission();
    if (!micOk) {
      throw new Error('Microphone permission denied');
    }

    // Configure the microphone.
    LiveAudioStream.init({
      sampleRate: 16000,
      channels: 1,
      bitsPerSample: 16,
      bufferSize: 1024,
      wavFile: 'dummy.wav',
    });

    const url = signedUrl ??
      `wss://api.elevenlabs.io/v1/convai/conversation?agent_id=agent_01jwg91tqdfx0bw5kb70d5kq5t`;

    const ws = new WebSocket(url);
    socketRef.current = ws;

    ws.onopen = () => {
      setConnected(true);
      // Send mandatory initiation payload – here we rely on defaults on server side.
      ws.send(
        JSON.stringify({
          type: 'conversation_initiation_client_data',
        }),
      );
      // Start capturing audio once WebSocket is ready.
      LiveAudioStream.on('data', (base64: string) => {
        if (socketRef.current?.readyState === WebSocket.OPEN) {
          socketRef.current.send(
            JSON.stringify({user_audio_chunk: base64}),
          );
        }
      });
      LiveAudioStream.start();
    };

    ws.onmessage = (e) => {
      try {
        const message = JSON.parse(e.data);
        switch (message.type) {
          case 'ping':
            ws.send(
              JSON.stringify({
                type: 'pong',
                event_id: message.ping_event.event_id,
              }),
            );
            break;
          case 'user_transcript':
            onTranscript?.(
              message.user_transcription_event?.user_transcript ?? '',
            );
            break;
          case 'agent_response':
            onAgentResponse?.(
              message.agent_response_event?.agent_response ?? '',
            );
            break;
          case 'audio': {
            const b64 = message.audio_event?.audio_base_64;
            if (b64) {
              console.log('[useElevenLabsConversation] Received audio chunk, ensuring playback session...');
              ensurePlaybackSession();
              try {
                if (pcmSessionIdRef.current != null) {
                  console.log('[useElevenLabsConversation] Writing audio chunk to PCMPlayer...');
                  PCMPlayer.write(b64);
                } else {
                  console.warn('[useElevenLabsConversation] PCMPlayer not initialized, cannot write audio.');
                }
              } catch (err) {
                console.warn('[ElevenLabs] Error writing to PCMPlayer', err);
              }
            }
            break;
          }
          default:
            // ignore
        }
      } catch (err) {
        console.warn('[ElevenLabs] WS message error', err);
      }
    };

    ws.onerror = (err) => {
      console.error('[ElevenLabs] WebSocket error', err);
    };

    ws.onclose = (event) => { // Add event argument to log details
      console.log('[ElevenLabs] WebSocket connection closed. Reason:', event?.reason, 'Code:', event?.code);
      LiveAudioStream.stop();
      setConnected(false);
      stopPlaybackSession();
    };
  }, [agentId, connected, ensurePlaybackSession, onAgentResponse, onTranscript, requestMicPermission, signedUrl, stopPlaybackSession]);

  const stop = useCallback(() => {
    console.log('[useElevenLabsConversation] Main stop function called'); // Log when this stop is called
    LiveAudioStream.stop();
    socketRef.current?.close();
    socketRef.current = null;
  }, []);

  useEffect(() => {
    return () => {
      stop();
    };
  }, [stop]);

  return {start, stop, connected};
}

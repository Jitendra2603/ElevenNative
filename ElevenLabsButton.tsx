import React, {useState, useCallback} from 'react';
import {TouchableOpacity, Text, StyleSheet, View} from 'react-native';
import useElevenLabsConversation from './useElevenLabsConversation';

export default function ElevenLabsButton({
  agentId,
  signedUrl,
}: {
  agentId?: string;
  signedUrl?: string;
}) {
  const [transcript, setTranscript] = useState('');
  const [reply, setReply] = useState('');
  const {start, stop, connected} = useElevenLabsConversation({
    agentId,
    signedUrl,
    onTranscript: setTranscript,
    onAgentResponse: setReply,
  });

  const toggle = useCallback(() => {
    if (connected) {
      stop();
    } else {
      start();
    }
  }, [connected, start, stop]);

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.button, connected && styles.buttonActive]}
        onPress={toggle}>
        <Text style={styles.buttonText}>{connected ? 'Stop' : 'Talk'}</Text>
      </TouchableOpacity>
      {transcript ? (
        <Text style={styles.text}>You: {transcript}</Text>
      ) : null}
      {reply ? <Text style={styles.text}>Bot: {reply}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    padding: 16,
  },
  button: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonActive: {
    backgroundColor: '#dc2626',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  text: {
    marginTop: 12,
    color: '#e5e7eb',
  },
}); 
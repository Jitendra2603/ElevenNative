import React, {useCallback, useState} from 'react';
import {
  SafeAreaView,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
} from 'react-native';
import useElevenLabsConversation from './useElevenLabsConversation';

interface Msg {
  id: string;
  text: string;
  from: 'user' | 'agent';
}

/**
 * A minimal chat-style UI with a single round microphone button.
 */
export default function ConversationScreen() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [recording, setRecording] = useState(false);

  const append = useCallback((text: string, from: 'user' | 'agent') => {
    setMessages(prev => [
      ...prev,
      {id: Math.random().toString(36).slice(2), text, from},
    ]);
  }, []);

  const {start, stop} = useElevenLabsConversation({
    agentId: '0tjYsxZlQF7N9Lflb3yL',
    onTranscript: txt => append(txt, 'user'),
    onAgentResponse: txt => append(txt, 'agent'),
  });

  const toggle = useCallback(() => {
    if (recording) {
      stop();
      setRecording(false);
    } else {
      start();
      setRecording(true);
    }
  }, [recording, start, stop]);

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" />
      <FlatList
        data={messages}
        keyExtractor={m => m.id}
        contentContainerStyle={styles.list}
        renderItem={({item}) => (
          <View
            style={[
              styles.bubble,
              item.from === 'user' ? styles.userBubble : styles.agentBubble,
            ]}>
            <Text style={styles.bubbleText}>{item.text}</Text>
          </View>
        )}
      />
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={toggle}
        style={[styles.micBtn, recording && styles.micBtnOn]}> 
        <Text style={styles.micTxt}>{recording ? '■' : '🎙️'}</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {flex: 1, backgroundColor: '#0f172a'},
  list: {padding: 16, paddingBottom: 100},
  bubble: {
    marginVertical: 4,
    padding: 10,
    borderRadius: 16,
    maxWidth: '80%',
  },
  userBubble: {
    backgroundColor: '#2563eb',
    alignSelf: 'flex-end',
  },
  agentBubble: {
    backgroundColor: '#334155',
    alignSelf: 'flex-start',
  },
  bubbleText: {color: 'white', fontSize: 16},
  micBtn: {
    position: 'absolute',
    bottom: 24,
    alignSelf: 'center',
    backgroundColor: '#64748b',
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
  },
  micBtnOn: {backgroundColor: '#dc2626'},
  micTxt: {fontSize: 32, color: 'white'},
}); 
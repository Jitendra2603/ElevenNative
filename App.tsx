/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React from 'react';
import {StatusBar} from 'react-native';
import ConversationScreen from './ConversationScreen';

export default function App() {
  return (
    <>
      <StatusBar barStyle="light-content" />
      <ConversationScreen />
    </>
  );
}

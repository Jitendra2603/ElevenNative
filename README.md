This is a new [**React Native**](https://reactnative.dev) project, bootstrapped using [`@react-native-community/cli`](https://github.com/react-native-community/cli).

# Getting Started

> **Note**: Make sure you have completed the [Set Up Your Environment](https://reactnative.dev/docs/set-up-your-environment) guide before proceeding.

## Step 1: Start Metro

First, you will need to run **Metro**, the JavaScript build tool for React Native.

To start the Metro dev server, run the following command from the root of your React Native project:

```sh
# Using npm
npm start

# OR using Yarn
yarn start
```

## Step 2: Build and run your app

With Metro running, open a new terminal window/pane from the root of your React Native project, and use one of the following commands to build and run your Android or iOS app:

### Android

```sh
# Using npm
npm run android

# OR using Yarn
yarn android
```

### iOS

For iOS, remember to install CocoaPods dependencies (this only needs to be run on first clone or after updating native deps).

The first time you create a new project, run the Ruby bundler to install CocoaPods itself:

```sh
bundle install
```

Then, and every time you update your native dependencies, run:

```sh
bundle exec pod install
```

For more information, please visit [CocoaPods Getting Started guide](https://guides.cocoapods.org/using/getting-started.html).

```sh
# Using npm
npm run ios

# OR using Yarn
yarn ios
```

If everything is set up correctly, you should see your new app running in the Android Emulator, iOS Simulator, or your connected device.

This is one way to run your app — you can also build it directly from Android Studio or Xcode.

## Step 3: Modify your app

Now that you have successfully run the app, let's make changes!

Open `App.tsx` in your text editor of choice and make some changes. When you save, your app will automatically update and reflect these changes — this is powered by [Fast Refresh](https://reactnative.dev/docs/fast-refresh).

When you want to forcefully reload, for example to reset the state of your app, you can perform a full reload:

- **Android**: Press the <kbd>R</kbd> key twice or select **"Reload"** from the **Dev Menu**, accessed via <kbd>Ctrl</kbd> + <kbd>M</kbd> (Windows/Linux) or <kbd>Cmd ⌘</kbd> + <kbd>M</kbd> (macOS).
- **iOS**: Press <kbd>R</kbd> in iOS Simulator.

## Congratulations! :tada:

You've successfully run and modified your React Native App. :partying_face:

### Now what?

- If you want to add this new React Native code to an existing application, check out the [Integration guide](https://reactnative.dev/docs/integration-with-existing-apps).
- If you're curious to learn more about React Native, check out the [docs](https://reactnative.dev/docs/getting-started).

# Troubleshooting

If you're having issues getting the above steps to work, see the [Troubleshooting](https://reactnative.dev/docs/troubleshooting) page.

# Learn More

To learn more about React Native, take a look at the following resources:

- [React Native Website](https://reactnative.dev) - learn more about React Native.
- [Getting Started](https://reactnative.dev/docs/environment-setup) - an **overview** of React Native and how setup your environment.
- [Learn the Basics](https://reactnative.dev/docs/getting-started) - a **guided tour** of the React Native **basics**.
- [Blog](https://reactnative.dev/blog) - read the latest official React Native **Blog** posts.
- [`@facebook/react-native`](https://github.com/facebook/react-native) - the Open Source; GitHub **repository** for React Native.

# ElevenNative

A reference React-Native 0.79 iOS app that shows ultra-low-latency **bidirectional** PCM streaming with the ElevenLabs Conversational-AI WebSocket.

*   Mic captured @ 16 kHz / 16-bit / mono via `react-native-live-audio-stream`.
*   Streams straight to ElevenLabs; receives audio chunks back and plays them immediately with a 40-line Swift native module (`PCMPlayer`).
*   **No files ever touch disk** – pure memory buffers.
*   Works on real devices (classic architecture – new-arch disabled).

---

## Quick start
```bash
# clone & install
npm i               # or pnpm / yarn
cd ios && pod install && cd ..

# start Metro on all interfaces (important for real device)
npx react-native start -- --reset-cache --host 0.0.0.0

# plug in the iPhone (same Wi-Fi as Mac) and run
npx react-native run-ios --device "My iPhone"
```
Edit **`ios/ElevenNative/AppDelegate.swift`** and replace `192.168.x.x` with your Mac's Wi-Fi IP if needed.

The chat-style screen is in `ConversationScreen.tsx`; tap the round mic to talk, tap again to stop.

---

## Directory layout
```
App.tsx                     – entry, renders ConversationScreen
ConversationScreen.tsx      – minimal chat UI + mic button
useElevenLabsConversation.ts – hook owning WS + audio input/output
PCMPlayer.ts                – JS façade for native player

ios/ElevenNative/
  PCMPlayer.swift           – tiny Swift native module
  PCMPlayerBridge.m         – Obj-C bridge for React-Native
  AppDelegate.swift         – RN bootstrap + Metro URL
  main.m                    – classic entry point
```

---

## How playback works
1.  ElevenLabs sends base-64 PCM chunks (16 k / Int16 / mono).
2.  `PCMPlayer.ts` forwards to Swift.
3.  `PCMPlayer.swift` decodes → `AVAudioPCMBuffer` (16 k / Int16).
4.  A single `AVAudioConverter` resamples / converts to mixer format (44.1 k or 48 k / Float32 / stereo).
5.  Converted buffer is scheduled on an `AVAudioPlayerNode` – latency ≈ 64 ms (1024 frames @ 16 k).

---

## Troubleshooting
| Symptom | Fix |
|---------|-----|
| **Could not connect to the server** | Metro must run with `--host 0.0.0.0`; hard-code IP in `AppDelegate.swift`. |
| **duplicate symbol _main**         | Remove `@main` from Swift `AppDelegate`, keep classic `main.m`. |
| **OSStatus -10868**                | Use `AVAudioConverter`, don't connect 16 k format to mixer directly. |
| No audio but logs scheduling       | Check iPhone volume & ringer; confirm `[PCMPlayer] playerNode.playing: 1`. |

MIT licence – use at will. :)

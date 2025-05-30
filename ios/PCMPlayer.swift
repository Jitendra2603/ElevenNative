// PCMPlayer – lightweight AVAudioEngine-based PCM streaming player registered as a Native Module.
#if canImport(AVFoundation)
import AVFoundation
#endif
import React

@objc(PCMPlayer)
class PCMPlayer: NSObject, RCTBridgeModule {
  static func moduleName() -> String! { "PCMPlayer" }
  static func requiresMainQueueSetup() -> Bool { false }

  private var engine: AVAudioEngine?
  private var playerNode: AVAudioPlayerNode?
  private var audioFormat: AVAudioFormat?
  private var mixerFormat: AVAudioFormat?
  private var converter: AVAudioConverter?

  @objc(setup:channels:)
  func setup(_ sampleRate: NSNumber, channels: NSNumber) {
    NSLog("[PCMPlayer.swift] setup called with sampleRate: %@, channels: %@", sampleRate, channels)
    if engine != nil {
        NSLog("[PCMPlayer.swift] Engine already initialized. Skipping setup.")
        return
    }
    engine = AVAudioEngine()
    playerNode = AVAudioPlayerNode()

    guard let engine = engine, let playerNode = playerNode else {
        NSLog("[PCMPlayer.swift] Failed to create engine or playerNode.")
        return
    }

    NSLog("[PCMPlayer.swift] Attaching playerNode.")
    engine.attach(playerNode)
    audioFormat = AVAudioFormat(commonFormat: .pcmFormatInt16,
                               sampleRate: sampleRate.doubleValue,
                               channels: AVAudioChannelCount(truncating: channels),
                               interleaved: false)

    // Configure AVAudioSession for playback over the speaker
    do {
      let session = AVAudioSession.sharedInstance()
      try session.setCategory(.playAndRecord, mode: .default, options: [.defaultToSpeaker, .allowBluetooth, .allowAirPlay])
      try session.setPreferredSampleRate(sampleRate.doubleValue)
      try session.setActive(true, options: [])
      NSLog("[PCMPlayer.swift] AVAudioSession configured (category=playAndRecord, sampleRate=%@)", sampleRate)
    } catch {
      NSLog("[PCMPlayer.swift] Failed to configure AVAudioSession: %@", error.localizedDescription)
    }

    // Connect without specifying a format so the engine picks the mixer's native format
    NSLog("[PCMPlayer.swift] Connecting playerNode to mainMixerNode (let engine choose format)")
    engine.connect(playerNode, to: engine.mainMixerNode, format: nil)

    // Prepare a converter from 16-kHz/Int16 mono to the mixer's format (often 48-kHz/Float32 stereo)
    mixerFormat = engine.mainMixerNode.outputFormat(forBus: 0)
    if let src = audioFormat, let dst = mixerFormat {
      converter = AVAudioConverter(from: src, to: dst)
      if converter == nil {
        NSLog("[PCMPlayer.swift] Failed to create AVAudioConverter from %@ -> %@", src, dst)
      } else {
        NSLog("[PCMPlayer.swift] AVAudioConverter created src=%@ dst=%@", src, dst)
      }
    }

    do {
      NSLog("[PCMPlayer.swift] Attempting to start engine...")
      try engine.start()
      NSLog("[PCMPlayer.swift] Engine started successfully.")
      NSLog("[PCMPlayer.swift] PlayerNode playing: %d", playerNode.isPlaying)
      if !playerNode.isPlaying {
          NSLog("[PCMPlayer.swift] Attempting to play playerNode...")
          playerNode.play()
          NSLog("[PCMPlayer.swift] playerNode.play() called. Now playing: %d", playerNode.isPlaying)
      }
    } catch {
      NSLog("[PCMPlayer.swift] Engine failed to start with error: %@", error.localizedDescription)
    }
  }

  @objc(write:)
  func write(_ base64: NSString) {
    // NSLog("[PCMPlayer.swift] write called with base64 data: %@...", (base64 as String).prefix(30)) // Can be too verbose
    guard let engine = engine, engine.isRunning else {
        NSLog("[PCMPlayer.swift] Write called but engine is nil or not running.")
        return
    }
    guard let playerNode = playerNode else {
        NSLog("[PCMPlayer.swift] Write called but playerNode is nil.")
        return
    }
    guard playerNode.isPlaying else {
        NSLog("[PCMPlayer.swift] Write called but playerNode is not playing. Attempting to play...")
        playerNode.play() // Try to ensure it's playing
        if !playerNode.isPlaying {
            NSLog("[PCMPlayer.swift] Still not playing after explicit play() in write.")
            return
        }
      return
    }

    guard let data = Data(base64Encoded: base64 as String),
          let fmt = audioFormat else {
        NSLog("[PCMPlayer.swift] Failed to decode base64 or audioFormat is nil.")
        return
    }

    let frames = UInt32(data.count / Int(fmt.streamDescription.pointee.mBytesPerFrame))
    if frames == 0 {
        NSLog("[PCMPlayer.swift] Received empty audio frame after base64 decoding.")
        return
    }
    guard let srcBuffer = AVAudioPCMBuffer(pcmFormat: fmt, frameCapacity: frames) else {
        NSLog("[PCMPlayer.swift] Failed to create AVAudioPCMBuffer.")
        return
    }
    srcBuffer.frameLength = frames

    // Copy PCM data into the src buffer (mono, non-interleaved)
    data.withUnsafeBytes { rawBuffer in
      if let dst = srcBuffer.int16ChannelData?[0] {
        memcpy(dst, rawBuffer.baseAddress!, data.count)
      } else {
        NSLog("[PCMPlayer.swift] int16ChannelData is nil – cannot copy audio bytes")
        return
      }
    }

    // Convert to mixer format if needed
    if let conv = converter, let dstFormat = mixerFormat {
      guard let dstBuffer = AVAudioPCMBuffer(pcmFormat: dstFormat, frameCapacity: UInt32(dstFormat.sampleRate / fmt.sampleRate) * srcBuffer.frameLength) else {
        NSLog("[PCMPlayer.swift] Failed to create destination buffer for conversion")
        return
      }
      var error: NSError?
      let status = conv.convert(to: dstBuffer, error: &error) { _, outStatus in
        outStatus.pointee = .haveData
        return srcBuffer
      }
      if status == .haveData {
        NSLog("[PCMPlayer.swift] Scheduling converted buffer frames=%u", dstBuffer.frameLength)
        playerNode.scheduleBuffer(dstBuffer, completionHandler: nil)
      } else if let err = error {
        NSLog("[PCMPlayer.swift] Conversion error: %@", err.localizedDescription)
      } else {
        NSLog("[PCMPlayer.swift] Conversion produced no data (status %d)", status.rawValue)
      }
    } else {
      // Fallback – schedule source buffer directly (may fail)
      NSLog("[PCMPlayer.swift] Scheduling SOURCE buffer frames=%u (no converter)", srcBuffer.frameLength)
      playerNode.scheduleBuffer(srcBuffer, completionHandler: nil)
    }
  }

  @objc(stop)
  func stop() {
    NSLog("[PCMPlayer.swift] stop called")
    playerNode?.stop()
    engine?.stop()
    engine = nil
    playerNode = nil
    audioFormat = nil // Also clear audioFormat
    NSLog("[PCMPlayer.swift] Player and engine stopped and deinitialized.")
  }
}

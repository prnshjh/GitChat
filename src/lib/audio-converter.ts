// src/lib/audio-converter.ts
// This utility converts WebM audio to MP3 format for AssemblyAI compatibility

export async function convertWebMToMp3(webmBlob: Blob): Promise<Blob> {
  try {
    // Create audio context
    const audioContext = new AudioContext({ sampleRate: 44100 })
    
    // Convert blob to array buffer
    const arrayBuffer = await webmBlob.arrayBuffer()
    
    // Decode audio data
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer)
    
    // For production with MP3 encoding, use lamejs:
    // import lamejs from 'lamejs'
    // const mp3encoder = new lamejs.Mp3Encoder(1, audioBuffer.sampleRate, 128)
    // ... encode to MP3
    
    // For now, convert to WAV which AssemblyAI also supports
    const wavBlob = await audioBufferToWav(audioBuffer)
    
    await audioContext.close()
    return wavBlob
  } catch (error) {
    console.error('Error converting audio:', error)
    throw error
  }
}

export async function audioBufferToWav(audioBuffer: AudioBuffer): Promise<Blob> {
  const numberOfChannels = audioBuffer.numberOfChannels
  const sampleRate = audioBuffer.sampleRate
  const format = 1 // PCM
  const bitDepth = 16

  const bytesPerSample = bitDepth / 8
  const blockAlign = numberOfChannels * bytesPerSample

  const data = new Float32Array(audioBuffer.length * numberOfChannels)
  
  // Interleave channels
  for (let i = 0; i < audioBuffer.length; i++) {
    for (let channel = 0; channel < numberOfChannels; channel++) {
      const offset = i * numberOfChannels + channel
      data[offset] = audioBuffer.getChannelData(channel)[i]!
    }
  }

  const dataLength = data.length * bytesPerSample
  const buffer = new ArrayBuffer(44 + dataLength)
  const view = new DataView(buffer)

  // Write WAV header
  const writeString = (offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i))
    }
  }

  writeString(0, 'RIFF')
  view.setUint32(4, 36 + dataLength, true)
  writeString(8, 'WAVE')
  writeString(12, 'fmt ')
  view.setUint32(16, 16, true)
  view.setUint16(20, format, true)
  view.setUint16(22, numberOfChannels, true)
  view.setUint32(24, sampleRate, true)
  view.setUint32(28, sampleRate * blockAlign, true)
  view.setUint16(32, blockAlign, true)
  view.setUint16(34, bitDepth, true)
  writeString(36, 'data')
  view.setUint32(40, dataLength, true)

  // Write audio data
  const volume = 0.8
  let offset = 44
  for (let i = 0; i < data.length; i++) {
    const sample = Math.max(-1, Math.min(1, data[i]! * volume))
    view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true)
    offset += 2
  }

  return new Blob([buffer], { type: 'audio/wav' })
}

// Alternative: Use FFmpeg.wasm for true MP3 conversion (client-side)
// This would require: npm install @ffmpeg/ffmpeg @ffmpeg/core
export async function convertToMp3WithFFmpeg(webmBlob: Blob): Promise<Blob> {
  // Implementation would use FFmpeg.wasm
  // This is more resource-intensive but produces true MP3 files
  
  throw new Error('FFmpeg conversion not implemented. Install @ffmpeg/ffmpeg to use this.')
}
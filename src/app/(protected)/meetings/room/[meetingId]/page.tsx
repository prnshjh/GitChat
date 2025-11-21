"use client"

import React, { useEffect, useRef, useState } from 'react'
import { useParams, useSearchParams, useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { MeetingChat } from './meeting-chat'
import { uploadFile } from '~/lib/supabase'
import { api } from '~/trpc/react'
import { StreamVideoClient, StreamVideo, StreamCall } from '@stream-io/video-react-sdk'
import { useUser } from '@clerk/nextjs'
import '@stream-io/video-react-sdk/dist/css/styles.css'
import { StreamMeetingUI } from './stream-meeting-ui'

export default function MeetingRoomPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()
  const { user } = useUser()
  const meetingId = params.meetingId as string
  const projectId = searchParams.get('projectId')

  const [client, setClient] = useState<StreamVideoClient | null>(null)
  const [call, setCall] = useState<any>(null)
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [recordingDuration, setRecordingDuration] = useState('00:00')

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const recordedChunksRef = useRef<Blob[]>([])
  const recordingStartTimeRef = useRef<Date | null>(null)

  const uploadMeeting = api.project.uploadMeeting.useMutation()

  // Initialize Stream client + call
  useEffect(() => {
    if (!user) return

    const initStream = async () => {
      try {
        const response = await fetch('/api/stream/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.id })
        })
        
        const { token } = await response.json()

        const streamClient = new StreamVideoClient({
          apiKey: process.env.NEXT_PUBLIC_STREAM_API_KEY!,
          user: {
            id: user.id,
            name: user.fullName || user.firstName || "Anonymous",
            image: user.imageUrl
          },
          token
        })

        setClient(streamClient)

        const streamCall = streamClient.call("default", meetingId)
        await streamCall.join({ create: true })
        setCall(streamCall)

        toast.success("Connected to meeting")
      } catch (error) {
        console.error(error)
        toast.error("Failed to connect to meeting")
      }
    }

    initStream()

    return () => {
      call?.leave()
      client?.disconnectUser()
    }
  }, [user, meetingId])

  // Timer for recording
  useEffect(() => {
    if (!isRecording) return

    const timer = setInterval(() => {
      if (recordingStartTimeRef.current) {
        const diff = Date.now() - recordingStartTimeRef.current.getTime()
        const minutes = Math.floor(diff / 60000)
        const seconds = Math.floor((diff % 60000) / 1000)
        setRecordingDuration(
          `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
        )
      }
    }, 1000)

    return () => clearInterval(timer)
  }, [isRecording])

  // Start recording audio
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: false
      })

      const options = {
        mimeType: "audio/webm;codecs=opus",
        audioBitsPerSecond: 128000
      }

      const mediaRecorder = new MediaRecorder(stream, options)
      mediaRecorderRef.current = mediaRecorder
      recordedChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = async () => {
        const webmBlob = new Blob(recordedChunksRef.current, { type: "audio/webm" })
        await convertAndSaveRecording(webmBlob)
        stream.getTracks().forEach((t) => t.stop())
      }

      mediaRecorder.start(1000)
      recordingStartTimeRef.current = new Date()
      setIsRecording(true)
      toast.success("Audio recording started")
    } catch (error) {
      console.error(error)
      toast.error("Failed to start recording")
    }
  }

  // Stop recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      recordingStartTimeRef.current = null
      setRecordingDuration("00:00")
      toast.success("Recording stopped. Processing...")
    }
  }

  // Convert WebM to WAV + Save
  const convertAndSaveRecording = async (webmBlob: Blob) => {
    try {
      toast.info("Converting audio...")

      const audioContext = new AudioContext()
      const arrayBuffer = await webmBlob.arrayBuffer()
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer)

      // Convert to WAV
      const wavBlob = await audioBufferToWav(audioBuffer)

      // Save WAV file
      await saveRecording(wavBlob, "audio/wav", ".wav")

    } catch (error) {
      console.error("Audio conversion failed:", error)
      toast.error("Conversion failed — saving as WebM")
      await saveRecording(webmBlob, "audio/webm", ".webm")
    }
  }

  // Convert AudioBuffer → WAV Blob
  const audioBufferToWav = async (audioBuffer: AudioBuffer): Promise<Blob> => {
    const numberOfChannels = audioBuffer.numberOfChannels
    const length = audioBuffer.length * numberOfChannels * 2
    const buffer = new ArrayBuffer(44 + length)
    const view = new DataView(buffer)
    const channels: Float32Array[] = []

    let pos = 0
    let offset = 0

    const setUint16 = (val: number) => {
      view.setUint16(pos, val, true)
      pos += 2
    }
    const setUint32 = (val: number) => {
      view.setUint32(pos, val, true)
      pos += 4
    }

    // Write header
    setUint32(0x46464952) // RIFF
    setUint32(36 + length)
    setUint32(0x45564157) // WAVE
    setUint32(0x20746d66)
    setUint32(16)
    setUint16(1)
    setUint16(numberOfChannels)
    setUint32(audioBuffer.sampleRate)
    setUint32(audioBuffer.sampleRate * 2 * numberOfChannels)
    setUint16(numberOfChannels * 2)
    setUint16(16)
    setUint32(0x61746164)
    setUint32(length)

    for (let i = 0; i < numberOfChannels; i++) {
      channels.push(audioBuffer.getChannelData(i))
    }

    while (pos < buffer.byteLength) {
      for (let i = 0; i < numberOfChannels; i++) {
        let sample = Math.max(-1, Math.min(1, channels[i][offset]))
        sample = sample < 0 ? sample * 0x8000 : sample * 0x7fff
        view.setInt16(pos, sample, true)
        pos += 2
      }
      offset++
    }

    return new Blob([buffer], { type: "audio/wav" })
  }

  // Upload and store recording
  const saveRecording = async (blob: Blob, mimeType: string, extension: string) => {
    try {
      if (!projectId) {
        toast.error("Missing projectId")
        return
      }

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
      const fileName = `meeting-${meetingId}-${timestamp}${extension}`
      const file = new File([blob], fileName, { type: mimeType })

      toast.info("Uploading recording...")

      const { success, url } = await uploadFile(file)

      if (success && url) {
        await uploadMeeting.mutateAsync({
          projectId,
          meetingUrl: url,
          name: `Live Meeting Recording - ${new Date().toLocaleString()}`
        })

        toast.success("Recording uploaded!")
      } else {
        toast.error("Upload failed")
      }
    } catch (error) {
      console.error(error)
      toast.error("Failed to save recording")
    }
  }

  // End meeting
  const endCall = async () => {
    if (isRecording) stopRecording()

    if (call) await call.leave()
    if (client) await client.disconnectUser()

    toast.success("Meeting ended")
    router.push("/meetings")
  }

  // Loading state
  if (!client || !call) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-6rem)] bg-gray-900">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-b-2 border-primary rounded-full mx-auto mb-4" />
          <p className="text-white">Connecting to meeting...</p>
        </div>
      </div>
    )
  }

  // Main UI
  return (
    <StreamVideo client={client}>
      <StreamCall call={call}>
        <div className="flex h-[calc(100vh-6rem)] bg-gray-900">

          <div className="flex-1 flex flex-col">
            <StreamMeetingUI
              isRecording={isRecording}
              recordingDuration={recordingDuration}
              onStartRecording={startRecording}
              onStopRecording={stopRecording}
              onEndCall={endCall}
              onToggleChat={() => setIsChatOpen(!isChatOpen)}
              isChatOpen={isChatOpen}
            />
          </div>

          {isChatOpen && (
            <MeetingChat
              call={call}
              onClose={() => setIsChatOpen(false)}
            />
          )}
        </div>
      </StreamCall>
    </StreamVideo>
  )
}

"use client"

import React, { useEffect, useRef, useState } from 'react'
import { useParams, useSearchParams, useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { uploadFile } from '~/lib/supabase'
import { api } from '~/trpc/react'
import { StreamVideoClient, StreamVideo, StreamCall } from '@stream-io/video-react-sdk'
import { useUser } from '@clerk/nextjs'
import '@stream-io/video-react-sdk/dist/css/styles.css'
import { StreamMeetingUI } from './stream-meeting-ui'
import { MeetingChat } from './meeting-chat'

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
            name: user.fullName || user.firstName || 'Anonymous',
            image: user.imageUrl
          },
          token
        })

        setClient(streamClient)

        const streamCall = streamClient.call('default', meetingId)
        await streamCall.join({ create: true })
        setCall(streamCall)

        toast.success('Connected to meeting')
      } catch (error) {
        console.error('Error initializing Stream:', error)
        toast.error('Failed to connect to meeting')
      }
    }

    initStream()

    return () => {
      call?.leave()
      client?.disconnectUser()
    }
  }, [user, meetingId])

  useEffect(() => {
    if (!isRecording) return

    const interval = setInterval(() => {
      if (recordingStartTimeRef.current) {
        const diff = Date.now() - recordingStartTimeRef.current.getTime()
        const minutes = Math.floor(diff / 60000)
        const seconds = Math.floor((diff % 60000) / 1000)
        setRecordingDuration(`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`)
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [isRecording])

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: false
      })

      const options = {
        mimeType: 'audio/webm;codecs=opus',
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
        const blob = new Blob(recordedChunksRef.current, { type: 'audio/webm' })
        await saveRecording(blob)
        stream.getTracks().forEach(track => track.stop())
      }

      mediaRecorder.start(1000)
      recordingStartTimeRef.current = new Date()
      setIsRecording(true)
      toast.success('Audio recording started')
    } catch (error) {
      console.error('Error starting recording:', error)
      toast.error('Failed to start recording')
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      recordingStartTimeRef.current = null
      setRecordingDuration('00:00')
      toast.success('Recording stopped. Uploading...')
    }
  }

  const saveRecording = async (blob: Blob) => {
    try {
      if (!projectId) {
        toast.error('Project ID is missing')
        return
      }

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
      const fileName = `meeting-audio-${meetingId}-${timestamp}.webm`
      const file = new File([blob], fileName, { type: 'audio/webm' })

      const { success, url } = await uploadFile(file)

      if (success && url) {
        await uploadMeeting.mutateAsync({
          projectId,
          meetingUrl: url,
          name: `Live Meeting Recording - ${new Date().toLocaleString()}`
        })

        toast.success('Recording uploaded successfully!')
      } else {
        toast.error('Failed to upload recording')
      }
    } catch (error) {
      console.error('Error saving recording:', error)
      toast.error('Failed to save recording')
    }
  }

  const endCall = async () => {
    if (isRecording) {
      stopRecording()
    }

    if (call) {
      await call.leave()
    }
    
    if (client) {
      await client.disconnectUser()
    }
    
    toast.success('Meeting ended')
    router.push('/meetings')
  }

  if (!client || !call) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-6rem)] bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-white">Connecting to meeting...</p>
        </div>
      </div>
    )
  }

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
"use client"

import React from 'react'
import { 
  CallControls,
  CallingState,
  SpeakerLayout,
  useCallStateHooks
} from '@stream-io/video-react-sdk'
import { Button } from '~/components/ui/button'
import { Circle, Square, MessageSquare, PhoneOff } from 'lucide-react'

interface StreamMeetingUIProps {
  isRecording: boolean
  recordingDuration: string
  onStartRecording: () => void
  onStopRecording: () => void
  onEndCall: () => void
  onToggleChat: () => void
  isChatOpen: boolean
}

export function StreamMeetingUI({
  isRecording,
  recordingDuration,
  onStartRecording,
  onStopRecording,
  onEndCall,
  onToggleChat,
  isChatOpen
}: StreamMeetingUIProps) {
  const { useCallCallingState, useParticipantCount } = useCallStateHooks()
  const callingState = useCallCallingState()
  const participantCount = useParticipantCount()

  if (callingState !== CallingState.JOINED) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-white">Connecting...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4 bg-gray-800 border-b border-gray-700">
        <div className="flex items-center gap-4">
          <h1 className="text-white font-semibold">Meeting Room</h1>
          {isRecording && (
            <div className="flex items-center gap-2 px-3 py-1 bg-red-600/20 rounded-full animate-pulse">
              <Circle className="h-3 w-3 text-red-500 fill-red-500" />
              <span className="text-sm text-red-500">{recordingDuration}</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-1 bg-gray-700 rounded-full">
            <span className="text-sm text-gray-300">{participantCount} participants</span>
          </div>
        </div>
      </div>

      <div className="flex-1 relative">
        <SpeakerLayout participantsBarPosition="bottom" />
      </div>

      <div className="p-4 bg-gray-800 border-t border-gray-700">
        <div className="flex items-center justify-center gap-3">
          <CallControls />

          <Button
            variant={isRecording ? "destructive" : "outline"}
            size="lg"
            onClick={isRecording ? onStopRecording : onStartRecording}
            className="rounded-full h-12 w-12"
          >
            {isRecording ? (
              <Square className="h-5 w-5" />
            ) : (
              <Circle className="h-5 w-5" />
            )}
          </Button>

          <Button
            variant={isChatOpen ? "secondary" : "outline"}
            size="lg"
            onClick={onToggleChat}
            className="rounded-full h-12 w-12"
          >
            <MessageSquare className="h-5 w-5" />
          </Button>

          <Button
            variant="destructive"
            size="lg"
            onClick={onEndCall}
            className="rounded-full h-12 w-12"
          >
            <PhoneOff className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  )
}
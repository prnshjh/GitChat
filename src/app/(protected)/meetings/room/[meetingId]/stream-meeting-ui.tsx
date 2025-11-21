// src/app/(protected)/meetings/room/[meetingId]/stream-meeting-ui.tsx
"use client"

import React, { useState, useEffect } from 'react'
import { 
  CallingState,
  SpeakerLayout,
  useCallStateHooks,
  ParticipantView
} from '@stream-io/video-react-sdk'
import { Button } from '~/components/ui/button'
import { 
  Circle, 
  Square, 
  MessageSquare, 
  PhoneOff,
  Mic,
  MicOff,
  Video as VideoIcon,
  VideoOff,
  MonitorUp,
  Settings,
  Users,
  Maximize2,
  Grid3x3
} from 'lucide-react'
import { cn } from '~/lib/utils'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu"

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
  const { 
    useCallCallingState, 
    useParticipantCount,
    useLocalParticipant,
    useParticipants,
    useMicrophoneState,
    useCameraState,
    useScreenShareState
  } = useCallStateHooks()
  
  const callingState = useCallCallingState()
  const participantCount = useParticipantCount()
  const localParticipant = useLocalParticipant()
  const participants = useParticipants()
  const { microphone, isMute } = useMicrophoneState()
  const { camera, isEnabled: isCameraEnabled } = useCameraState()
  const { screenShare, isScreenShareEnabled } = useScreenShareState()
  
  const [viewMode, setViewMode] = useState<'speaker' | 'grid'>('speaker')
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [meetingDuration, setMeetingDuration] = useState('00:00')
  const [startTime] = useState(Date.now())

  // Update meeting duration
  useEffect(() => {
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime
      const minutes = Math.floor(elapsed / 60000)
      const seconds = Math.floor((elapsed % 60000) / 1000)
      setMeetingDuration(`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`)
    }, 1000)
    return () => clearInterval(interval)
  }, [startTime])

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen()
      setIsFullscreen(true)
    } else {
      document.exitFullscreen()
      setIsFullscreen(false)
    }
  }

  if (callingState !== CallingState.JOINED) {
    return (
      <div className="flex items-center justify-center h-full bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        <div className="text-center space-y-4">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary border-t-transparent mx-auto"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <VideoIcon className="h-6 w-6 text-primary" />
            </div>
          </div>
          <div>
            <p className="text-white text-lg font-medium">Connecting to meeting...</p>
            <p className="text-gray-400 text-sm mt-2">Please wait while we set things up</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Top Header Bar */}
      <div className="relative z-10 flex items-center justify-between px-6 py-4 bg-gray-900/80 backdrop-blur-md border-b border-gray-700/50">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
            <span className="text-white font-medium text-sm">{meetingDuration}</span>
          </div>
          
          {isRecording && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-red-500/20 rounded-full border border-red-500/30 animate-pulse">
              <Circle className="h-2.5 w-2.5 text-red-500 fill-red-500" />
              <span className="text-sm text-red-400 font-medium">REC {recordingDuration}</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-4 py-2 bg-gray-800/80 rounded-full border border-gray-700/50">
            <Users className="h-4 w-4 text-gray-400" />
            <span className="text-sm text-gray-300 font-medium">{participantCount}</span>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={toggleFullscreen}
            className="h-9 w-9 rounded-full hover:bg-gray-800/80"
          >
            <Maximize2 className="h-4 w-4 text-gray-400" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-full hover:bg-gray-800/80"
              >
                <Settings className="h-4 w-4 text-gray-400" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-gray-800 border-gray-700">
              <DropdownMenuItem onClick={() => setViewMode('speaker')} className="text-gray-300">
                Speaker View
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setViewMode('grid')} className="text-gray-300">
                Grid View
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Video Content Area */}
      <div className="flex-1 relative overflow-hidden p-4">
        {viewMode === 'speaker' ? (
          <div className="h-full flex flex-col gap-4">
            {/* Main Speaker View */}
            <div className="flex-1 rounded-2xl overflow-hidden bg-gray-800/50 border border-gray-700/50 shadow-2xl relative group">
              {participants.length > 0 ? (
                <ParticipantView
                  participant={participants[0]!}
                  className="h-full w-full"
                />
              ) : (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center space-y-3">
                    <div className="h-20 w-20 rounded-full bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center mx-auto">
                      <Users className="h-10 w-10 text-white" />
                    </div>
                    <p className="text-gray-400 text-lg">Waiting for others to join...</p>
                  </div>
                </div>
              )}
            </div>

            {/* Thumbnail Strip */}
            {participants.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                {participants.slice(1).map((participant) => (
                  <div
                    key={participant.sessionId}
                    className="min-w-[200px] h-32 rounded-xl overflow-hidden bg-gray-800 border-2 border-gray-700/50 hover:border-primary/50 transition-all shadow-lg"
                  >
                    <ParticipantView participant={participant} />
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* Grid View */
          <div className={cn(
            "grid gap-4 h-full",
            participants.length === 1 && "grid-cols-1",
            participants.length === 2 && "grid-cols-2",
            participants.length <= 4 && participants.length > 2 && "grid-cols-2 grid-rows-2",
            participants.length > 4 && "grid-cols-3"
          )}>
            {participants.map((participant) => (
              <div
                key={participant.sessionId}
                className="rounded-2xl overflow-hidden bg-gray-800/50 border border-gray-700/50 shadow-xl hover:border-primary/30 transition-all"
              >
                <ParticipantView participant={participant} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bottom Control Bar */}
      <div className="relative z-10 px-6 py-4 bg-gray-900/90 backdrop-blur-md border-t border-gray-700/50">
        <div className="flex items-center justify-center gap-3">
          {/* Microphone */}
          <Button
            variant={isMute ? "destructive" : "secondary"}
            size="lg"
            onClick={() => microphone.toggle()}
            className={cn(
              "h-14 w-14 rounded-full shadow-lg transition-all hover:scale-105",
              isMute ? "bg-red-500 hover:bg-red-600" : "bg-gray-700 hover:bg-gray-600"
            )}
          >
            {isMute ? (
              <MicOff className="h-6 w-6" />
            ) : (
              <Mic className="h-6 w-6" />
            )}
          </Button>

          {/* Camera */}
          <Button
            variant={!isCameraEnabled ? "destructive" : "secondary"}
            size="lg"
            onClick={() => camera.toggle()}
            className={cn(
              "h-14 w-14 rounded-full shadow-lg transition-all hover:scale-105",
              !isCameraEnabled ? "bg-red-500 hover:bg-red-600" : "bg-gray-700 hover:bg-gray-600"
            )}
          >
            {!isCameraEnabled ? (
              <VideoOff className="h-6 w-6" />
            ) : (
              <VideoIcon className="h-6 w-6" />
            )}
          </Button>

          {/* Screen Share */}
          <Button
            variant={isScreenShareEnabled ? "default" : "secondary"}
            size="lg"
            onClick={() => screenShare.toggle()}
            className={cn(
              "h-14 w-14 rounded-full shadow-lg transition-all hover:scale-105",
              isScreenShareEnabled ? "bg-primary hover:bg-primary/90" : "bg-gray-700 hover:bg-gray-600"
            )}
          >
            <MonitorUp className="h-6 w-6" />
          </Button>

          {/* Divider */}
          <div className="h-12 w-px bg-gray-700/50 mx-2"></div>

          {/* Recording */}
          <Button
            variant={isRecording ? "destructive" : "secondary"}
            size="lg"
            onClick={isRecording ? onStopRecording : onStartRecording}
            className={cn(
              "h-14 w-14 rounded-full shadow-lg transition-all hover:scale-105",
              isRecording ? "bg-red-500 hover:bg-red-600 animate-pulse" : "bg-gray-700 hover:bg-gray-600"
            )}
          >
            {isRecording ? (
              <Square className="h-6 w-6" />
            ) : (
              <Circle className="h-6 w-6" />
            )}
          </Button>

          {/* Chat */}
          <Button
            variant={isChatOpen ? "default" : "secondary"}
            size="lg"
            onClick={onToggleChat}
            className={cn(
              "h-14 w-14 rounded-full shadow-lg transition-all hover:scale-105 relative",
              isChatOpen ? "bg-primary hover:bg-primary/90" : "bg-gray-700 hover:bg-gray-600"
            )}
          >
            <MessageSquare className="h-6 w-6" />
          </Button>

          {/* View Mode Toggle */}
          <Button
            variant="secondary"
            size="lg"
            onClick={() => setViewMode(viewMode === 'speaker' ? 'grid' : 'speaker')}
            className="h-14 w-14 rounded-full shadow-lg bg-gray-700 hover:bg-gray-600 transition-all hover:scale-105"
          >
            <Grid3x3 className="h-6 w-6" />
          </Button>

          {/* Divider */}
          <div className="h-12 w-px bg-gray-700/50 mx-2"></div>

          {/* End Call */}
          <Button
            variant="destructive"
            size="lg"
            onClick={onEndCall}
            className="h-14 w-14 rounded-full shadow-lg bg-red-600 hover:bg-red-700 transition-all hover:scale-105"
          >
            <PhoneOff className="h-6 w-6" />
          </Button>
        </div>

        {/* Control Labels (on hover) */}
        <div className="flex items-center justify-center gap-3 mt-2">
          <span className="text-xs text-gray-500">
            {isMute ? 'Unmute' : 'Mute'}
          </span>
          <span className="text-xs text-gray-500">
            {isCameraEnabled ? 'Stop video' : 'Start video'}
          </span>
          <span className="text-xs text-gray-500">Share</span>
          <div className="w-8"></div>
          <span className="text-xs text-gray-500">
            {isRecording ? 'Stop rec' : 'Record'}
          </span>
          <span className="text-xs text-gray-500">Chat</span>
          <span className="text-xs text-gray-500">View</span>
          <div className="w-8"></div>
          <span className="text-xs text-gray-500">Leave</span>
        </div>
      </div>

      <style jsx global>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  )
}
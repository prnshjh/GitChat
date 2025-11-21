// "use client"

// import React from 'react'
// import { 
//   CallControls,
//   CallingState,
//   SpeakerLayout,
//   useCallStateHooks
// } from '@stream-io/video-react-sdk'
// import { Button } from '~/components/ui/button'
// import { Circle, Square, MessageSquare, PhoneOff } from 'lucide-react'

// interface StreamMeetingUIProps {
//   isRecording: boolean
//   recordingDuration: string
//   onStartRecording: () => void
//   onStopRecording: () => void
//   onEndCall: () => void
//   onToggleChat: () => void
//   isChatOpen: boolean
// }

// export function StreamMeetingUI({
//   isRecording,
//   recordingDuration,
//   onStartRecording,
//   onStopRecording,
//   onEndCall,
//   onToggleChat,
//   isChatOpen
// }: StreamMeetingUIProps) {
//   const { useCallCallingState, useParticipantCount } = useCallStateHooks()
//   const callingState = useCallCallingState()
//   const participantCount = useParticipantCount()

//   if (callingState !== CallingState.JOINED) {
//     return (
//       <div className="flex items-center justify-center h-full">
//         <div className="text-center">
//           <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
//           <p className="text-white">Connecting...</p>
//         </div>
//       </div>
//     )
//   }

//   return (
//     <div className="flex flex-col h-full">
//       <div className="flex items-center justify-between p-4 bg-gray-800 border-b border-gray-700">
//         <div className="flex items-center gap-4">
//           <h1 className="text-white font-semibold">Meeting Room</h1>
//           {isRecording && (
//             <div className="flex items-center gap-2 px-3 py-1 bg-red-600/20 rounded-full animate-pulse">
//               <Circle className="h-3 w-3 text-red-500 fill-red-500" />
//               <span className="text-sm text-red-500">{recordingDuration}</span>
//             </div>
//           )}
//         </div>
//         <div className="flex items-center gap-2">
//           <div className="flex items-center gap-2 px-3 py-1 bg-gray-700 rounded-full">
//             <span className="text-sm text-gray-300">{participantCount} participants</span>
//           </div>
//         </div>
//       </div>

//       <div className="flex-1 relative">
//         <SpeakerLayout participantsBarPosition="bottom" />
//       </div>

//       <div className="p-4 bg-gray-800 border-t border-gray-700">
//         <div className="flex items-center justify-center gap-3">
//           <CallControls />

//           <Button
//             variant={isRecording ? "destructive" : "outline"}
//             size="lg"
//             onClick={isRecording ? onStopRecording : onStartRecording}
//             className="rounded-full h-12 w-12"
//           >
//             {isRecording ? (
//               <Square className="h-5 w-5" />
//             ) : (
//               <Circle className="h-5 w-5" />
//             )}
//           </Button>

//           <Button
//             variant={isChatOpen ? "secondary" : "outline"}
//             size="lg"
//             onClick={onToggleChat}
//             className="rounded-full h-12 w-12"
//           >
//             <MessageSquare className="h-5 w-5" />
//           </Button>

//           <Button
//             variant="destructive"
//             size="lg"
//             onClick={onEndCall}
//             className="rounded-full h-12 w-12"
//           >
//             <PhoneOff className="h-5 w-5" />
//           </Button>
//         </div>
//       </div>
//     </div>
//   )
// }
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

// ✨ Improved UI — Clean, modern, glassmorphic, centered, with better spacing
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
      <div className="flex items-center justify-center h-full bg-gradient-to-br from-gray-900 via-black to-gray-900">
        <div className="text-center backdrop-blur-md p-6 rounded-2xl bg-white/5 border border-white/10 shadow-xl">
          <div className="animate-spin rounded-full h-14 w-14 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-200 text-lg font-medium tracking-wide">Connecting to meeting...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-[#0e0e0f] via-[#1a1a1c] to-[#0e0e0f] text-white">
      {/* Top Bar */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-white/10 backdrop-blur-xl bg-white/5 shadow-md">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-semibold tracking-wide">Meeting Room</h1>
          {isRecording && (
            <div className="flex items-center gap-2 px-3 py-1 bg-red-600/20 rounded-full animate-pulse border border-red-600/30">
              <Circle className="h-3 w-3 text-red-500 fill-red-500" />
              <span className="text-sm text-red-400 font-medium">{recordingDuration}</span>
            </div>
          )}
        </div>

        <div className="px-3 py-1 rounded-full bg-white/10 border border-white/20 shadow-sm">
          <span className="text-sm text-gray-300 tracking-wide">{participantCount} participants</span>
        </div>
      </div>

      {/* Main Video Layout */}
      <div className="flex-1 relative rounded-xl overflow-hidden m-4 shadow-xl border border-white/10 bg-black/20 backdrop-blur-sm">
        <SpeakerLayout participantsBarPosition="bottom" />
      </div>

      {/* Bottom Control Bar */}
      <div className="px-6 py-4 border-t border-white/10 bg-white/5 backdrop-blur-lg shadow-xl">
        <div className="flex items-center justify-center gap-5">
          <div className="scale-110">
            <CallControls />
          </div>

          {/* Recording Button */}
          <Button
            variant={isRecording ? "destructive" : "outline"}
            size="lg"
            onClick={isRecording ? onStopRecording : onStartRecording}
            className="rounded-full h-14 w-14 flex items-center justify-center bg-white/10 border-white/20 hover:bg-white/20 transition-all"
          >
            {isRecording ? (
              <Square className="h-6 w-6" />
            ) : (
              <Circle className="h-6 w-6" />
            )}
          </Button>

          {/* Chat Button */}
          <Button
            variant={isChatOpen ? "secondary" : "outline"}
            size="lg"
            onClick={onToggleChat}
            className="rounded-full h-14 w-14 flex items-center justify-center bg-white/10 border-white/20 hover:bg-white/20 transition-all"
          >
            <MessageSquare className="h-6 w-6" />
          </Button>

          {/* End Call */}
          <Button
            variant="destructive"
            size="lg"
            onClick={onEndCall}
            className="rounded-full h-14 w-14 flex items-center justify-center bg-red-600 hover:bg-red-700 text-white shadow-lg"
          >
            <PhoneOff className="h-6 w-6" />
          </Button>
        </div>
      </div>
    </div>
  )
}

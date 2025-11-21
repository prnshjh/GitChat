// src/app/(protected)/meetings/room/[meetingId]/meeting-chat.tsx
"use client"

import React, { useState, useEffect } from 'react'
import { Button } from '~/components/ui/button'
import { X, Send, Smile } from 'lucide-react'
import { Card } from '~/components/ui/card'
import { useUser } from '@clerk/nextjs'
import { 
  Channel,
  MessageInput,
  MessageList,
  Thread,
  Window,
  ChannelHeader
} from 'stream-chat-react'
import { StreamChat } from 'stream-chat'
import 'stream-chat-react/dist/css/v2/index.css'

interface MeetingChatProps {
  call: any
  onClose: () => void
}

export function MeetingChat({ call, onClose }: MeetingChatProps) {
  const { user } = useUser()
  const [chatClient, setChatClient] = useState<StreamChat | null>(null)
  const [channel, setChannel] = useState<any>(null)

  useEffect(() => {
    if (!user) return

    const initChat = async () => {
      try {
        const response = await fetch('/api/stream/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.id })
        })
        
        const { token } = await response.json()

        const client = StreamChat.getInstance(process.env.NEXT_PUBLIC_STREAM_API_KEY!)
        
        await client.connectUser(
          {
            id: user.id,
            name: user.fullName || user.firstName || 'Anonymous',
            image: user.imageUrl
          },
          token
        )

        const meetingChannel = client.channel('messaging', call.id, {
          name: `Meeting Chat`,
          members: [user.id]
        })

        await meetingChannel.watch()
        
        setChatClient(client)
        setChannel(meetingChannel)
      } catch (error) {
        console.error('Error initializing chat:', error)
      }
    }

    initChat()

    return () => {
      if (channel) {
        channel.stopWatching()
      }
      if (chatClient) {
        chatClient.disconnectUser()
      }
    }
  }, [user, call])

  if (!chatClient || !channel) {
    return (
      <Card className="w-96 h-full bg-gray-900 border-gray-700 flex items-center justify-center shadow-2xl">
        <div className="text-center space-y-3">
          <div className="relative">
            <div className="animate-spin rounded-full h-10 w-10 border-4 border-primary border-t-transparent mx-auto"></div>
          </div>
          <p className="text-sm text-gray-400">Loading chat...</p>
        </div>
      </Card>
    )
  }

  return (
    <Card className="w-96 h-full bg-gray-900/95 backdrop-blur-xl border-gray-700/50 flex flex-col overflow-hidden shadow-2xl">
      {/* Custom Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-700/50 bg-gray-800/80 backdrop-blur-sm">
        <div>
          <h3 className="text-white font-semibold text-lg">Meeting Chat</h3>
          <p className="text-xs text-gray-400 mt-0.5">Messages disappear after meeting</p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="h-8 w-8 text-gray-400 hover:text-white hover:bg-gray-800 rounded-full"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Stream Chat UI */}
      <div className="flex-1 overflow-hidden meeting-chat-container">
        <Channel channel={channel}>
          <Window>
            <MessageList />
            <MessageInput />
          </Window>
          <Thread />
        </Channel>
      </div>

      <style jsx global>{`
        .meeting-chat-container {
          --str-chat__primary-color: #3b82f6;
          --str-chat__active-primary-color: #2563eb;
          --str-chat__surface-color: #111827;
          --str-chat__secondary-surface-color: #1f2937;
          --str-chat__primary-surface-color: #030712;
          --str-chat__primary-surface-color-low-emphasis: #111827;
          --str-chat__border-color: rgba(75, 85, 99, 0.3);
          --str-chat__text-color: #f9fafb;
          --str-chat__text-low-emphasis-color: #9ca3af;
          --str-chat__disabled-color: #4b5563;
          --str-chat__own-message-bubble-color: #3b82f6;
        }

        .meeting-chat-container .str-chat {
          height: 100%;
        }

        .meeting-chat-container .str-chat__container {
          background: transparent;
          height: 100%;
        }

        .meeting-chat-container .str-chat__main-panel {
          padding: 0;
        }

        .meeting-chat-container .str-chat__list {
          background: transparent;
          padding: 1rem;
        }

        .meeting-chat-container .str-chat__list-notifications {
          background: rgba(31, 41, 55, 0.8);
          backdrop-filter: blur(8px);
        }

        /* Message styling */
        .meeting-chat-container .str-chat__message-simple {
          padding: 0.5rem 0;
        }

        .meeting-chat-container .str-chat__message-simple__text__inner {
          background: rgba(55, 65, 81, 0.8);
          backdrop-filter: blur(8px);
          color: #f9fafb;
          border-radius: 1rem;
          padding: 0.75rem 1rem;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.3);
          border: 1px solid rgba(75, 85, 99, 0.2);
        }

        .meeting-chat-container .str-chat__message-simple--me .str-chat__message-simple__text__inner {
          background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
          color: white;
          border: 1px solid rgba(59, 130, 246, 0.3);
        }

        /* Avatar styling */
        .meeting-chat-container .str-chat__avatar {
          border-radius: 50%;
          border: 2px solid rgba(75, 85, 99, 0.3);
        }

        /* Input area */
        .meeting-chat-container .str-chat__input-flat {
          background: rgba(31, 41, 55, 0.8);
          backdrop-filter: blur(8px);
          border-top: 1px solid rgba(75, 85, 99, 0.3);
          padding: 1rem;
        }

        .meeting-chat-container .str-chat__input-flat-wrapper {
          background: rgba(17, 24, 39, 0.8);
          border: 1px solid rgba(75, 85, 99, 0.3);
          border-radius: 1.5rem;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.3);
        }

        .meeting-chat-container .str-chat__textarea textarea {
          color: #f9fafb;
          background: transparent;
        }

        .meeting-chat-container .str-chat__textarea textarea::placeholder {
          color: #6b7280;
        }

        /* Send button */
        .meeting-chat-container .str-chat__send-button {
          background: #3b82f6;
          border-radius: 50%;
          width: 2.5rem;
          height: 2.5rem;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }

        .meeting-chat-container .str-chat__send-button:hover {
          background: #2563eb;
          transform: scale(1.05);
        }

        /* Timestamp */
        .meeting-chat-container .str-chat__message-simple-timestamp {
          color: #6b7280;
          font-size: 0.75rem;
        }

        /* Reactions */
        .meeting-chat-container .str-chat__reaction-list {
          background: rgba(31, 41, 55, 0.9);
          backdrop-filter: blur(8px);
          border: 1px solid rgba(75, 85, 99, 0.3);
          border-radius: 1rem;
        }

        /* Typing indicator */
        .meeting-chat-container .str-chat__typing-indicator {
          color: #9ca3af;
          font-size: 0.875rem;
          padding: 0.5rem 1rem;
        }

        /* Scrollbar */
        .meeting-chat-container .str-chat__list::-webkit-scrollbar {
          width: 6px;
        }

        .meeting-chat-container .str-chat__list::-webkit-scrollbar-track {
          background: transparent;
        }

        .meeting-chat-container .str-chat__list::-webkit-scrollbar-thumb {
          background: rgba(75, 85, 99, 0.5);
          border-radius: 3px;
        }

        .meeting-chat-container .str-chat__list::-webkit-scrollbar-thumb:hover {
          background: rgba(107, 114, 128, 0.7);
        }

        /* Empty state */
        .meeting-chat-container .str-chat__empty-channel {
          color: #9ca3af;
        }

        /* Link preview */
        .meeting-chat-container .str-chat__message-attachment-card {
          background: rgba(31, 41, 55, 0.8);
          border: 1px solid rgba(75, 85, 99, 0.3);
          border-radius: 0.75rem;
        }

        /* Hide header as we have custom one */
        .meeting-chat-container .str-chat__header-livestream {
          display: none;
        }

        /* Date separator */
        .meeting-chat-container .str-chat__date-separator {
          color: #6b7280;
        }

        .meeting-chat-container .str-chat__date-separator-line {
          background: rgba(75, 85, 99, 0.3);
        }
      `}</style>
    </Card>
  )
}
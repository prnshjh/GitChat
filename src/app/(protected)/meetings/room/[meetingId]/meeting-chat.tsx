"use client"

import React, { useState, useEffect } from 'react'
import { Button } from '~/components/ui/button'
import { X } from 'lucide-react'
import { Card } from '~/components/ui/card'
import { useUser } from '@clerk/nextjs'
import { 
  Channel,
  Chat,
  MessageInput,
  MessageList,
  Thread,
  Window
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

    let mounted = true
    let client: StreamChat | null = null
    let meetingChannel: any = null

    const initChat = async () => {
      try {
        const response = await fetch('/api/stream/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.id })
        })
        
        const { token } = await response.json()

        client = StreamChat.getInstance(process.env.NEXT_PUBLIC_STREAM_API_KEY!)
        
        // Avoid consecutive connectUser calls if already connected
        if (!client.userID) {
          await client.connectUser(
            {
              id: user.id,
              name: user.fullName || user.firstName || 'Anonymous',
              image: user.imageUrl
            },
            token
          )
        } else if (client.userID !== user.id) {
          // If a different user is connected, reset and connect the correct user
          await client.disconnectUser()
          await client.connectUser(
            {
              id: user.id,
              name: user.fullName || user.firstName || 'Anonymous',
              image: user.imageUrl
            },
            token
          )
        }

        meetingChannel = client.channel('messaging', call.id, {
          name: `Meeting Chat - ${call.id}`,
          members: [user.id]
        })

        await meetingChannel.watch()
        
        if (!mounted) return
        setChatClient(client)
        setChannel(meetingChannel)
      } catch (error) {
        console.error('Error initializing chat:', error)
      }
    }

    initChat()

    return () => {
      mounted = false
      if (meetingChannel) {
        try { meetingChannel.stopWatching() } catch {}
      }
      if (client) {
        try { client.disconnectUser() } catch {}
      }
    }
  }, [user, call])

  if (!chatClient || !channel) {
    return (
      <Card className="w-80 h-full bg-gray-800 border-gray-700 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-sm text-gray-400">Loading chat...</p>
        </div>
      </Card>
    )
  }

  return (
    <Card className="w-80 h-full bg-gray-800 border-gray-700 flex flex-col overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b border-gray-700 bg-gray-800">
        <h3 className="text-white font-semibold">Meeting Chat</h3>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="h-8 w-8 text-gray-400 hover:text-white"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex-1 overflow-hidden stream-chat-meeting">
        <Chat client={chatClient}>
          <Channel channel={channel}>
            <Window>
              <MessageList />
              <MessageInput />
            </Window>
            <Thread />
          </Channel>
        </Chat>
      </div>

      <style jsx global>{`
        .stream-chat-meeting {
          --str-chat__primary-color: #3b82f6;
          --str-chat__active-primary-color: #2563eb;
          --str-chat__surface-color: #1f2937;
          --str-chat__secondary-surface-color: #374151;
          --str-chat__primary-surface-color: #111827;
          --str-chat__primary-surface-color-low-emphasis: #1f2937;
          --str-chat__border-color: #4b5563;
          --str-chat__text-color: #f9fafb;
          --str-chat__text-low-emphasis-color: #9ca3af;
        }

        .stream-chat-meeting .str-chat__container {
          background: transparent;
        }

        .stream-chat-meeting .str-chat__list {
          background: #1f2937;
          padding: 1rem;
        }

        .stream-chat-meeting .str-chat__message-simple__text__inner {
          background: #374151;
          color: #f9fafb;
        }

        .stream-chat-meeting .str-chat__message-simple--me .str-chat__message-simple__text__inner {
          background: #3b82f6;
          color: white;
        }

        .stream-chat-meeting .str-chat__input-flat {
          background: #374151;
          border-top: 1px solid #4b5563;
        }

        .stream-chat-meeting .str-chat__input-flat-wrapper {
          background: #1f2937;
          border: 1px solid #4b5563;
          border-radius: 0.5rem;
        }

        .stream-chat-meeting .str-chat__header-livestream {
          display: none;
        }
      `}</style>
    </Card>
  )
}
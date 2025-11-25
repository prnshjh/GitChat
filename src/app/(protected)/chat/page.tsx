// src/app/(protected)/chat/page.tsx
"use client"

import React, { useEffect, useState } from 'react'
import { StreamChat } from 'stream-chat'
import {
  Chat,
  Channel,
  ChannelHeader,
  MessageInput,
  MessageList,
  Thread,
  Window,
  ChannelList,
  useChatContext,
  LoadingIndicator,
} from 'stream-chat-react'
import { useUser } from '@clerk/nextjs'
import useProject from '~/hooks/use-project'
import { api } from '~/trpc/react'
import { 
  Loader2, Hash, Users, Bell, Pin, Search, 
  Plus, MessageSquare, Video, Phone, X,
  Settings, MoreVertical, Trash2
} from 'lucide-react'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Badge } from '~/components/ui/badge'
import { toast } from 'sonner'
import 'stream-chat-react/dist/css/v2/index.css'

const ChatPage = () => {
  const { user } = useUser()
  const { project, projectId } = useProject()
  const { data: teamMembers } = api.project.getTeamMembers.useQuery(
    { projectId },
    { enabled: !!projectId }
  )

  const [chatClient, setChatClient] = useState<StreamChat | null>(null)
  const [activeChannel, setActiveChannel] = useState<any>(null)
  const [showSearch, setShowSearch] = useState(false)

  // Keep the actual client instance in a ref so we can control init/cleanup
  const clientRef = React.useRef<StreamChat | null>(null)

  // Init Stream Chat client ONCE when all data needed is available
  useEffect(() => {
    if (!user || !projectId || !project || !teamMembers) return

    // already initialized → do nothing
    if (clientRef.current) return

    const initChat = async () => {
      try {
        const response = await fetch('/api/stream/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: user.id,
            name: user.fullName || user.firstName || 'Anonymous',
            image: user.imageUrl,
          }),
        })

        const { token } = await response.json()

        const client = StreamChat.getInstance(
          process.env.NEXT_PUBLIC_STREAM_API_KEY!
        )

        // cache in ref
        clientRef.current = client

        await client.connectUser(
          {
            id: user.id,
            name: user.fullName || user.firstName || 'Anonymous',
            image: user.imageUrl,
          },
          token
        )

        setChatClient(client)
        toast.success('Connected to team chat')
      } catch (error) {
        console.error('Chat initialization failed:', error)
        toast.error('Failed to connect to chat')
      }
    }

    void initChat()
  }, [user, projectId, project, teamMembers])

  // Disconnect ONLY when the component unmounts
  useEffect(() => {
    return () => {
      if (clientRef.current) {
        clientRef.current.disconnectUser()
        clientRef.current = null
      }
    }
  }, [])

  if (!chatClient) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-6rem)]">
        <div className="text-center space-y-3">
          <Loader2 className="h-10 w-10 animate-spin mx-auto text-primary" />
          <p className="text-sm text-muted-foreground">Loading chat...</p>
        </div>
      </div>
    )
  }

  // ... rest of your component stays the same


  // Filter team members - exclude current user
  const otherMembers = teamMembers?.filter(m => m.userId !== user.id) || []

  return (
    <div className="h-[calc(100vh-6rem)]">
      <Chat client={chatClient} theme="str-chat__theme-light">
        <div className="flex h-full">
          {/* Left Sidebar - Team Members List */}
          <div className="w-80 border-r bg-muted/30 flex flex-col">
            <div className="p-4 border-b">
              <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
                <MessageSquare className="h-5 w-5 text-primary" />
                Team Members
              </h2>
              
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search members..."
                  className="pl-10"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-2">
              {otherMembers.length === 0 ? (
                <div className="text-center p-8 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">No team members yet</p>
                  <p className="text-xs mt-1">Invite members to start chatting</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {otherMembers.map((member) => (
                    <TeamMemberCard
                      key={member.userId}
                      member={member}
                      currentUserId={user.id}
                      chatClient={chatClient}
                      activeChannel={activeChannel}
                      setActiveChannel={setActiveChannel}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Current User Info */}
            <div className="p-4 border-t">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <img
                    src={user.imageUrl}
                    alt={user.fullName || ''}
                    className="w-10 h-10 rounded-full"
                  />
                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-background rounded-full"></span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {user.fullName}
                  </p>
                  <p className="text-xs text-muted-foreground">Online</p>
                </div>
              </div>
            </div>
          </div>

          {/* Main Chat Area */}
          <div className="flex-1 flex flex-col">
            {activeChannel ? (
              <Channel channel={activeChannel}>
                <Window>
                  <CustomChannelHeader 
                    showSearch={showSearch}
                    setShowSearch={setShowSearch}
                  />
                  
                  {showSearch && <SearchBar onClose={() => setShowSearch(false)} />}
                  
                  <MessageList />
                  <MessageInput />
                </Window>
                <Thread />
              </Channel>
            ) : (
              <div className="flex-1 flex items-center justify-center text-center p-8">
                <div>
                  <MessageSquare className="h-20 w-20 mx-auto mb-4 text-muted-foreground opacity-20" />
                  <h3 className="text-lg font-semibold mb-2">No chat selected</h3>
                  <p className="text-sm text-muted-foreground">
                    Select a team member to start chatting
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </Chat>

      <style jsx global>{`
        /* Custom Chat Styling */
        .str-chat {
          height: 100%;
        }

        .str-chat__container {
          height: 100%;
        }

        .str-chat-channel-list {
          height: calc(100% - 73px);
        }

        .str-chat__channel-list-messenger {
          background: transparent;
        }

        .str-chat__channel-preview-messenger--active {
          background: hsl(var(--primary) / 0.1);
          border-left: 3px solid hsl(var(--primary));
        }

        .str-chat__channel-preview-messenger:hover {
          background: hsl(var(--muted));
        }

        /* Messages */
        .str-chat__message-simple {
          padding: 0.5rem 1rem;
        }

        .str-chat__message-simple__text__inner {
          background: hsl(var(--muted));
          color: hsl(var(--foreground));
          border-radius: 1rem;
          padding: 0.75rem 1rem;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
        }

        .str-chat__message-simple--me .str-chat__message-simple__text__inner {
          background: hsl(var(--primary));
          color: hsl(var(--primary-foreground));
        }

        /* Input */
        .str-chat__input-flat {
          background: hsl(var(--background));
          border-top: 1px solid hsl(var(--border));
          padding: 1rem;
        }

        .str-chat__input-flat-wrapper {
          background: hsl(var(--muted));
          border: 1px solid hsl(var(--border));
          border-radius: 0.75rem;
        }

        .str-chat__textarea textarea {
          color: hsl(var(--foreground));
          background: transparent;
        }

        /* Reactions */
        .str-chat__reaction-list {
          background: hsl(var(--popover));
          border: 1px solid hsl(var(--border));
          border-radius: 0.5rem;
        }

        /* Thread */
        .str-chat__thread {
          border-left: 1px solid hsl(var(--border));
        }

        /* Typing Indicator */
        .str-chat__typing-indicator {
          color: hsl(var(--muted-foreground));
        }
      `}</style>
    </div>
  )
}

// Team Member Card Component - Creates 1-on-1 DM channel
function TeamMemberCard({ member, currentUserId, chatClient, activeChannel, setActiveChannel }: any) {
  const handleClick = async () => {
    try {
      // Create a direct message channel between current user and this member
      const channel = chatClient.channel('messaging', {
        members: [currentUserId, member.userId],
      })
      
      await channel.watch()
      setActiveChannel(channel)
    } catch (error) {
      console.error('Failed to create channel:', error)
      toast.error('Failed to open chat')
    }
  }

  const isActive = activeChannel?.data?.id === `${currentUserId}-${member.userId}` || 
                   activeChannel?.data?.id === `${member.userId}-${currentUserId}`

  return (
    <div
      onClick={handleClick}
      className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
        isActive ? 'bg-primary/10 border-l-2 border-primary' : 'hover:bg-muted'
      }`}
    >
      <div className="relative">
        <img
          src={member.user.imageUrl || ''}
          alt={member.user.firstName || ''}
          className="w-10 h-10 rounded-full"
        />
        <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-background rounded-full"></span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">
          {member.user.firstName} {member.user.lastName}
        </p>
        <p className="text-xs text-muted-foreground">Online</p>
      </div>
    </div>
  )
}

// Custom Channel Header Component
function CustomChannelHeader({ showSearch, setShowSearch }: any) {
  const { channel } = useChatContext()
  
  // Get the other user's info from the channel members
  const members = Object.values(channel?.state?.members || {})
  const otherMember = members.find((m: any) => m.user?.id !== channel?.data?.created_by?.id)

  return (
    <div className="flex items-center justify-between p-4 border-b bg-background">
      <div className="flex items-center gap-3">
        {otherMember && (
          <>
            <div className="relative">
              <img
                src={(otherMember as any).user?.image || ''}
                alt={(otherMember as any).user?.name || ''}
                className="w-10 h-10 rounded-full"
              />
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-background rounded-full"></span>
            </div>
            <div>
              <h3 className="font-semibold">{(otherMember as any).user?.name}</h3>
              <p className="text-xs text-muted-foreground">Online</p>
            </div>
          </>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Button 
          variant="ghost" 
          size="icon"
          onClick={() => setShowSearch(!showSearch)}
          title="Search messages"
        >
          <Search className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" title="Pinned messages">
          <Pin className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

// Search Bar Component
function SearchBar({ onClose }: { onClose: () => void }) {
  return (
    <div className="p-4 border-b bg-muted/50">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search messages..."
          className="pl-10 pr-10"
        />
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

export default ChatPage
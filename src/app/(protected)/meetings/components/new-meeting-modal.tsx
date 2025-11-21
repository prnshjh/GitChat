"use client"

import React, { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '~/components/ui/dialog'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '~/components/ui/tabs'
import { Video, Link as LinkIcon, Copy, Check } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import useProject from '~/hooks/use-project'

interface NewMeetingModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function NewMeetingModal({ open, onOpenChange }: NewMeetingModalProps) {
  const [meetingLink, setMeetingLink] = useState('')
  const [generatedLink, setGeneratedLink] = useState('')
  const [copied, setCopied] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const router = useRouter()
  const { projectId } = useProject()

  const generateMeetingLink = async () => {
    if (!projectId) {
      toast.error('Please select a project first')
      return
    }

    setIsGenerating(true)
    try {
      const meetingId = `meeting-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      const link = `${window.location.origin}/meetings/room/${meetingId}?projectId=${projectId}`
      setGeneratedLink(link)
      toast.success('Meeting link generated!')
    } catch (error) {
      toast.error('Failed to generate meeting link')
    } finally {
      setIsGenerating(false)
    }
  }

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(generatedLink)
      setCopied(true)
      toast.success('Link copied to clipboard!')
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      toast.error('Failed to copy link')
    }
  }

  const handleJoinMeeting = () => {
    if (!meetingLink.trim()) {
      toast.error('Please enter a meeting link')
      return
    }

    try {
      const url = new URL(meetingLink)
      const pathname = url.pathname
      const meetingId = pathname.split('/').pop()
      const projectIdParam = url.searchParams.get('projectId')
      
      if (meetingId && projectIdParam) {
        router.push(`/meetings/room/${meetingId}?projectId=${projectIdParam}`)
        onOpenChange(false)
      } else {
        toast.error('Invalid meeting link')
      }
    } catch (error) {
      toast.error('Invalid meeting link format')
    }
  }

  const handleStartMeeting = () => {
    if (!generatedLink) {
      toast.error('Please generate a meeting link first')
      return
    }

    const url = new URL(generatedLink)
    const pathname = url.pathname
    const meetingId = pathname.split('/').pop()
    const projectIdParam = url.searchParams.get('projectId')
    
    if (meetingId && projectIdParam) {
      router.push(`/meetings/room/${meetingId}?projectId=${projectIdParam}`)
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Video className="h-5 w-5" />
            New Meeting
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="join" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="join">Join Meeting</TabsTrigger>
            <TabsTrigger value="start">Start Meeting</TabsTrigger>
          </TabsList>

          <TabsContent value="join" className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Meeting Link</label>
              <Input
                placeholder="Paste meeting link here..."
                value={meetingLink}
                onChange={(e) => setMeetingLink(e.target.value)}
                className="w-full"
              />
            </div>
            <Button onClick={handleJoinMeeting} className="w-full">
              Join Meeting
            </Button>
          </TabsContent>

          <TabsContent value="start" className="space-y-4">
            <div className="space-y-4">
              {!generatedLink ? (
                <div className="text-center py-4">
                  <p className="text-sm text-muted-foreground mb-4">
                    Create a new meeting and share the link with participants
                  </p>
                  <Button
                    onClick={generateMeetingLink}
                    disabled={isGenerating}
                    className="w-full"
                  >
                    <LinkIcon className="mr-2 h-4 w-4" />
                    {isGenerating ? 'Generating...' : 'Generate Meeting Link'}
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Meeting Link</label>
                    <div className="flex gap-2">
                      <Input
                        value={generatedLink}
                        readOnly
                        className="flex-1"
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={copyToClipboard}
                      >
                        {copied ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={handleStartMeeting}
                      className="flex-1"
                    >
                      Start Meeting
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setGeneratedLink('')}
                    >
                      Generate New
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
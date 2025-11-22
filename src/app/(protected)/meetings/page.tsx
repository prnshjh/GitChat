"use client"
import React, { useState } from 'react'
import useProject from '~/hooks/use-project'
import { api } from '~/trpc/react'
import MeetingCard from '../dashboard/meeting-card'
import Link from 'next/link'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import { toast } from 'sonner'
import useRefetch from '~/hooks/use-refetch'
import { NewMeetingModal } from './components/new-meeting-modal'
import { Video, Upload } from 'lucide-react'

const MeetingPage = () => {
    const {projectId}= useProject()
    const {data: meetings, isLoading} = api.project.getMeetings.useQuery({projectId},{
        refetchInterval: 4000
    })
    const deleteMeeting = api.project.deleteMeeting.useMutation();
    const refetch = useRefetch()
    const [showNewMeetingModal, setShowNewMeetingModal] = useState(false)

  return (
    <>
        <div className="flex items-center justify-between mb-6">
            <div>
                <h1 className='text-xl font-semibold'>Meetings</h1>
                <p className='text-sm text-muted-foreground'>
                    Record and analyze your meetings or start live video calls
                </p>
            </div>
            {/* Upload Meeting button moved to top right */}
            <Button 
                onClick={() => {
                    // Scroll to upload section
                   <MeetingCard></MeetingCard>
                }}
                variant="outline"
                className="gap-2"
            >
                <Upload className="h-4 w-4" />
                Upload Meeting
            </Button>
        </div>

        <NewMeetingModal 
            open={showNewMeetingModal} 
            onOpenChange={setShowNewMeetingModal}
        />

        {/* New Meeting button in central area */}
        <div id="upload-section" className="flex flex-col items-center justify-center py-12 mb-8 border-2 rounded-lg bg-muted/20 bg-white">
            <Video className="h-12 w-12 text-muted-foreground mb-4 animate-bounce" />
            <h2 className="text-lg font-semibold mb-2">Create a new meeting</h2>
            <p className="text-sm text-muted-foreground mb-4 text-center max-w-md">
                Analyse your meeting with GitChat.<br />
                Powered by AI
            </p>
            <Button 
                onClick={() => setShowNewMeetingModal(true)}
                className="gap-2"
                size="lg"
            >
                <Video className="h-5 w-5" />
                New Meeting
            </Button>
        </div>

        {/* Upload Meeting Card */}
        

        <div className="h-6"></div>
        <h2 className='text-lg font-semibold mb-2'>Recorded Meetings</h2>
        <div className="h-1"></div>
        {meetings && meetings.length === 0 && <div>No meetings found</div> }
        {isLoading && <div>Loading...</div>}
        <ul className='divide-y divide-gray-200'>
            {meetings?.map(meeting=>(
                <li key={meeting.id} className='flex items-center justify-between py-5 gap-x-6'>
                    <div>
                        <div className='min-w-0 '>
                            <div className='flex items-center gap-2 '>
                                <Link href={`/meetings/${meeting.id}`} className='text-sm font-semibold  hover:underline'>
                                    {meeting.name}
                                </Link>
                                {meeting.status === 'PROCESSING' && (
                                    <Badge className='bg-yellow-500 text-white'>
                                        Processing...
                                    </Badge>
                                )}
                            </div>
                        </div>
                        <div className='flex items-center text-xs text-gray-500 gap-x-2'>
                                <p className='whitespace-nowrap'>
                                    {meeting.createdAt.toLocaleDateString()}
                                </p>
                                <p className='truncate'>
                                    {meeting.issues.length} issues
                                </p>
                        </div>
                    </div>
                    <div className='flex items-center felx-none gap-x-4'>
                                <Link href={`/meetings/${meeting.id}`}  className='text-sm font-semibold'>
                                    <Button variant={'outline'} >
                                        View
                                    </Button>
                                </Link>
                                <Button size={'sm'} disabled={deleteMeeting.isPending} variant={'destructive'} onClick={()=>{ deleteMeeting.mutate({meetingId:meeting.id},{
                                    onSuccess:()=>{
                                        toast.success('Meeting deleted successfully')
                                        refetch()
                                    },
                                    onError:()=>{
                                        toast.error('Failed to delete meeting')
                                    }
                                }) }} >
                                    Delete
                                </Button>
                    </div>
                </li>
            ))}
        </ul>
    </>
  )
}

export default MeetingPage
"use client"
import React, { useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { uploadFile } from '~/lib/supabase'
import { Upload, Loader2 } from 'lucide-react'
import { Button } from '~/components/ui/button'
import { toast } from 'sonner'
import { api } from '~/trpc/react'
import useProject from '~/hooks/use-project'
import { useRouter } from 'next/navigation'
import { useMutation } from '@tanstack/react-query'
import axios from 'axios'

const MeetingCard = () => {
    const project = useProject()
    const router = useRouter()
    const [isUploading, setIsUploading] = useState(false)

    const processMeeting = useMutation({
        mutationFn: async (data: { meetingUrl: string; meetingId: string; projectId: string }) => {
            const { meetingUrl, meetingId, projectId } = data
            const response = await axios.post('/api/process-meeting', {
                meetingUrl,
                meetingId,
                projectId,
            })
            return response.data
        },
    })

    const uploadMeeting = api.project.uploadMeeting.useMutation()

    const { getInputProps, getRootProps } = useDropzone({
        accept: { 'audio/*': [] },
        multiple: false,
        onDrop: async (acceptedFiles) => {
            setIsUploading(true)

            const file = acceptedFiles[0]
            if (!file) {
                toast.error('Audio files only')
                setIsUploading(false)
                return
            }

            if (file.size >= 50 * 1024 * 1024) {
                toast.error('File size limited to 50MB')
                setIsUploading(false)
                return
            }

            const { url } = await uploadFile(file)

            uploadMeeting.mutate(
                {
                    projectId: project.projectId,
                    meetingUrl: url!,
                    name: file.name,
                },
                {
                    onSuccess: (meeting) => {
                        toast.success('Meeting uploaded successfully')
                        router.push('/meetings')
                        processMeeting.mutateAsync({
                            meetingUrl: url!,
                            meetingId: meeting.id,
                            projectId: project.projectId,
                        })
                    },
                    onError: () => toast.error('Failed to upload meeting'),
                },
            )

            setIsUploading(false)
        },
    })

    return (
        <div {...getRootProps()}>
            <Button disabled={isUploading}>
                {!isUploading ? (
                    <>
                        <Upload className="h-5 w-5 mr-2" />
                        Upload Meeting
                    </>
                ) : (
                    <>
                        <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                        Uploading...
                    </>
                )}
                <input className="hidden" {...getInputProps()} />
            </Button>
        </div>
    )
}

export default MeetingCard

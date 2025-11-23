"use client"
import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card'
import { Badge } from '~/components/ui/badge'
import { 
    GitBranch, 
    GitCommit, 
    FileCode, 
    AlertCircle, 
    CheckCircle2,
    TrendingUp,
    Calendar
} from 'lucide-react'
import useProject from '~/hooks/use-project'
import { api } from '~/trpc/react'
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar'
import 'react-circular-progressbar/dist/styles.css'

const RepoHealthCard = () => {
    const { project, projectId } = useProject()
    const { data: commits } = api.project.getCommits.useQuery(
        { projectId }, 
        { enabled: !!projectId }
    )
    
    // Calculate health metrics
    const totalCommits = commits?.length || 0
    const recentCommits = commits?.filter(c => {
        const commitDate = new Date(c.commitDate)
        const weekAgo = new Date()
        weekAgo.setDate(weekAgo.getDate() - 7)
        return commitDate > weekAgo
    }).length || 0
    
    const lastCommitDate = commits?.[0]?.commitDate
    const daysSinceLastCommit = lastCommitDate 
        ? Math.floor((Date.now() - new Date(lastCommitDate).getTime()) / (1000 * 60 * 60 * 24))
        : 0
    
    // Health score calculation (0-100)
    const calculateHealthScore = () => {
        let score = 70 // Base score
        
        // Recent activity bonus
        if (recentCommits > 5) score += 20
        else if (recentCommits > 2) score += 10
        else if (recentCommits > 0) score += 5
        
        // Recency penalty
        if (daysSinceLastCommit > 30) score -= 20
        else if (daysSinceLastCommit > 14) score -= 10
        else if (daysSinceLastCommit > 7) score -= 5
        
        return Math.max(0, Math.min(100, score))
    }
    
    const healthScore = calculateHealthScore()
    
    // Determine health status
    const getHealthStatus = () => {
        if (healthScore >= 80) return { label: 'Excellent', color: 'text-green-600', bgColor: 'bg-green-100', icon: CheckCircle2 }
        if (healthScore >= 60) return { label: 'Good', color: 'text-blue-600', bgColor: 'bg-blue-100', icon: TrendingUp }
        if (healthScore >= 40) return { label: 'Fair', color: 'text-yellow-600', bgColor: 'bg-yellow-100', icon: AlertCircle }
        return { label: 'Needs Attention', color: 'text-red-600', bgColor: 'bg-red-100', icon: AlertCircle }
    }
    
    const status = getHealthStatus()
    const StatusIcon = status.icon

    if (!project) {
        return (
            <Card className='col-span-2'>
                <CardContent className='p-6 flex items-center justify-center'>
                    <p className='text-sm text-muted-foreground'>Select a project to view health status</p>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className='col-span-2 bg-gradient-to-br from-background to-muted/20'>
            <CardHeader className='pb-3'>
                <div className='flex items-center justify-between'>
                    <div>
                        <CardTitle className='text-lg flex items-center gap-2'>
                            <GitBranch className='h-5 w-5 text-primary' />
                            Repository Health
                        </CardTitle>
                        <CardDescription className='mt-1'>
                            {project.name} status overview
                        </CardDescription>
                    </div>
                    <Badge variant='outline' className={`${status.bgColor} ${status.color} border-none px-3 py-1`}>
                        <StatusIcon className='h-3 w-3 mr-1' />
                        {status.label}
                    </Badge>
                </div>
            </CardHeader>
            
            <CardContent className='space-y-4'>
                {/* Health Score Circle */}
                <div className='flex items-center justify-between'>
                    <div className='flex-1 space-y-3'>
                        {/* Total Commits */}
                        <div className='flex items-center gap-3'>
                            <div className='h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center'>
                                <GitCommit className='h-5 w-5 text-primary' />
                            </div>
                            <div>
                                <p className='text-2xl font-bold'>{totalCommits}</p>
                                <p className='text-xs text-muted-foreground'>Total Commits</p>
                            </div>
                        </div>
                        
                        {/* Recent Activity */}
                        <div className='flex items-center gap-3'>
                            <div className='h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center'>
                                <TrendingUp className='h-5 w-5 text-green-600' />
                            </div>
                            <div>
                                <p className='text-2xl font-bold'>{recentCommits}</p>
                                <p className='text-xs text-muted-foreground'>Commits This Week</p>
                            </div>
                        </div>
                    </div>
                    
                    {/* Health Score Gauge */}
                    <div className='w-28 h-28'>
                        <CircularProgressbar
                            value={healthScore}
                            text={`${healthScore}%`}
                            styles={buildStyles({
                                textSize: '20px',
                                pathColor: healthScore >= 80 ? '#10b981' : 
                                          healthScore >= 60 ? '#3b82f6' : 
                                          healthScore >= 40 ? '#eab308' : '#ef4444',
                                textColor: healthScore >= 80 ? '#10b981' : 
                                          healthScore >= 60 ? '#3b82f6' : 
                                          healthScore >= 40 ? '#eab308' : '#ef4444',
                                trailColor: '#e5e7eb',
                            })}
                        />
                    </div>
                </div>
                
                {/* Last Activity */}
                <div className='pt-3 border-t'>
                    <div className='flex items-center justify-between text-sm'>
                        <div className='flex items-center gap-2 text-muted-foreground'>
                            <Calendar className='h-4 w-4' />
                            <span>Last commit</span>
                        </div>
                        <span className='font-medium'>
                            {daysSinceLastCommit === 0 
                                ? 'Today' 
                                : daysSinceLastCommit === 1 
                                    ? 'Yesterday'
                                    : `${daysSinceLastCommit} days ago`
                            }
                        </span>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}

export default RepoHealthCard
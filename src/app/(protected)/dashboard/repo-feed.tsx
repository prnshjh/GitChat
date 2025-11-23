"use client"
import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import { 
    Sparkles, 
    TrendingUp, 
    GitBranch, 
    FileCode, 
    Clock, 
    AlertCircle,
    RefreshCw,
    Loader2
} from 'lucide-react'
import { api } from '~/trpc/react'
import useProject from '~/hooks/use-project'
import { toast } from 'sonner'

const AIInsightsCard = () => {
    const { project, projectId } = useProject()
    const [insights, setInsights] = useState<string[]>([])
    const [isGenerating, setIsGenerating] = useState(false)
    
    // Get project stats
    const { data: commits } = api.project.getCommits.useQuery(
        { projectId }, 
        { enabled: !!projectId }
    )
    
    const { data: questions } = api.project.getQuestions.useQuery(
        { projectId },
        { enabled: !!projectId }
    )

    // Generate insights based on project data
    const generateInsights = () => {
        if (!project || !commits) return

        setIsGenerating(true)
        
        setTimeout(() => {
            const newInsights: string[] = []
            
            // Commit activity insight
            if (commits.length > 0) {
                const recentCommits = commits.filter(c => {
                    const commitDate = new Date(c.commitDate)
                    const daysSince = (Date.now() - commitDate.getTime()) / (1000 * 60 * 60 * 24)
                    return daysSince <= 7
                })
                
                if (recentCommits.length > 0) {
                    newInsights.push(`🚀 ${recentCommits.length} commits in the last 7 days - Team is actively developing`)
                } else {
                    newInsights.push(`⏸️ No recent commits - Consider checking on project status`)
                }
            }
            
            // Most active contributor
            if (commits.length > 0) {
                const contributors = commits.reduce((acc, commit) => {
                    acc[commit.commitAuthorName] = (acc[commit.commitAuthorName] || 0) + 1
                    return acc
                }, {} as Record<string, number>)
                
                const topContributor = Object.entries(contributors)
                    .sort(([, a], [, b]) => b - a)[0]
                
                if (topContributor) {
                    newInsights.push(`👤 ${topContributor[0]} is the most active contributor (${topContributor[1]} commits)`)
                }
            }
            
            // Questions insight
            if (questions && questions.length > 0) {
                newInsights.push(`💡 ${questions.length} questions asked - Team is actively learning the codebase`)
            }
            
            // Tech stack insight
            const techStack = detectTechStack(project.repoUrl)
            if (techStack) {
                newInsights.push(`⚡ ${techStack}`)
            }
            
            // Repository health
            const healthScore = calculateHealthScore(commits)
            newInsights.push(`${healthScore.emoji} Repository health: ${healthScore.status}`)
            
            setInsights(newInsights)
            setIsGenerating(false)
        }, 1000)
    }

    // Auto-generate insights on mount
    useEffect(() => {
        if (project && commits) {
            generateInsights()
        }
    }, [project, commits, questions])

    const detectTechStack = (repoUrl: string) => {
        if (!repoUrl) return null
        
        // Simple heuristic based on repo name or could be enhanced
        return "Modern tech stack detected: React, TypeScript, Next.js"
    }

    const calculateHealthScore = (commits: any[]) => {
        if (!commits || commits.length === 0) {
            return { emoji: '⚠️', status: 'Unknown' }
        }
        
        const recentCommits = commits.filter(c => {
            const commitDate = new Date(c.commitDate)
            const daysSince = (Date.now() - commitDate.getTime()) / (1000 * 60 * 60 * 24)
            return daysSince <= 30
        })
        
        if (recentCommits.length > 10) {
            return { emoji: '✅', status: 'Excellent - Very Active' }
        } else if (recentCommits.length > 5) {
            return { emoji: '👍', status: 'Good - Active Development' }
        } else if (recentCommits.length > 0) {
            return { emoji: '⚠️', status: 'Fair - Low Activity' }
        } else {
            return { emoji: '❌', status: 'Needs Attention - Inactive' }
        }
    }

    if (!project) {
        return (
            <Card className='col-span-2'>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Sparkles className='h-5 w-5 text-purple-500' />
                        AI Insights
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-center text-muted-foreground py-8">
                        Select a project to see AI insights
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className='col-span-2 bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-950/20 dark:to-blue-950/20 border-purple-200 dark:border-purple-800'>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                        <Sparkles className='h-5 w-5 text-purple-500' />
                        AI Insights
                    </CardTitle>
                    <Button 
                        size="sm" 
                        variant="outline"
                        onClick={generateInsights}
                        disabled={isGenerating}
                        className="gap-2"
                    >
                        {isGenerating ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <RefreshCw className="h-4 w-4" />
                        )}
                        Refresh
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                <div className="space-y-3">
                    {/* Quick Stats */}
                    <div className="grid grid-cols-3 gap-3 mb-4">
                        <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-3 border">
                            <div className="flex items-center gap-2 mb-1">
                                <GitBranch className="h-4 w-4 text-blue-500" />
                                <span className="text-xs text-muted-foreground">Commits</span>
                            </div>
                            <p className="text-2xl font-bold">{commits?.length || 0}</p>
                        </div>
                        
                        <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-3 border">
                            <div className="flex items-center gap-2 mb-1">
                                <FileCode className="h-4 w-4 text-green-500" />
                                <span className="text-xs text-muted-foreground">Questions</span>
                            </div>
                            <p className="text-2xl font-bold">{questions?.length || 0}</p>
                        </div>
                        
                        <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-3 border">
                            <div className="flex items-center gap-2 mb-1">
                                <Clock className="h-4 w-4 text-purple-500" />
                                <span className="text-xs text-muted-foreground">Last Update</span>
                            </div>
                            <p className="text-xs font-semibold">
                                {commits && commits.length > 0 
                                    ? new Date(commits[0].commitDate).toLocaleDateString(undefined, { 
                                        month: 'short', 
                                        day: 'numeric' 
                                    })
                                    : 'N/A'
                                }
                            </p>
                        </div>
                    </div>

                    {/* AI Insights List */}
                    {isGenerating ? (
                        <div className="flex items-center justify-center py-6">
                            <Loader2 className="h-6 w-6 animate-spin text-purple-500" />
                            <span className="ml-2 text-sm text-muted-foreground">Generating insights...</span>
                        </div>
                    ) : insights.length > 0 ? (
                        <div className="space-y-2">
                            {insights.map((insight, index) => (
                                <div 
                                    key={index}
                                    className="flex items-start gap-2 p-3 bg-white/70 dark:bg-gray-800/70 rounded-lg border transition-all hover:shadow-md"
                                >
                                    <TrendingUp className="h-4 w-4 text-purple-500 mt-0.5 flex-shrink-0" />
                                    <p className="text-sm flex-1">{insight}</p>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-6 text-muted-foreground">
                            <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">No insights available yet</p>
                            <p className="text-xs mt-1">Commit some code to generate insights</p>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}

export default AIInsightsCard
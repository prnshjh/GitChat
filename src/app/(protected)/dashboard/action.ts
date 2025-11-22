"use server"

import { streamText } from "ai"
import { createStreamableValue } from "ai/rsc"
import { createGoogleGenerativeAI } from "@ai-sdk/google"
import { generateEmbedding } from "~/lib/gemini"
import { db } from "~/server/db"

const google = createGoogleGenerativeAI({
    apiKey: process.env.GEMINI_API_KEY,
})

interface SearchResult {
    fileName: string
    sourceCode: string
    summary: string
    similarity: number
}

/**
 * Enhanced RAG query with improved retrieval
 */
export async function askQuestion(question: string, projectId: string) {
    const stream = createStreamableValue()
    
    try {
        // Step 1: Generate embedding
        const queryVector = await generateEmbedding(question)
        const vectorQuery = "[" + queryVector.join(",") + "]"

        // Step 2: Retrieve more candidates with lower threshold
        const candidates = await db.$queryRaw<SearchResult[]>`
            SELECT 
                "fileName", 
                "sourceCode", 
                "summary",
                1 - ("summaryEmbedding" <=> ${vectorQuery}::vector) AS similarity
            FROM "SourceCodeEmbedding"
            WHERE 1 - ("summaryEmbedding" <=> ${vectorQuery}::vector) > 0.3
            AND "projectId" = ${projectId}
            ORDER BY similarity DESC 
            LIMIT 30
        `

        console.log(`Found ${candidates.length} candidate documents`)

        // Step 3: Apply keyword boosting
        const scoredResults = applyKeywordBoosting(candidates, question)

        // Step 4: Select top results with diversity
        const finalResults = selectDiverseResults(scoredResults, 15)

        // Step 5: Build organized context
        const context = buildContext(finalResults)

        console.log(`Using ${finalResults.length} documents for context`)

        // Step 6: Generate streaming response
        ;(async () => {
            const { textStream } = await streamText({
                model: google("gemini-2.0-flash"),
                prompt: buildPrompt(question, context),
                temperature: 0.3,
                maxTokens: 2000,
            })

            for await (const delta of textStream) {
                stream.update(delta)
            }

            stream.done()
        })()

        return {
            output: stream.value,
            filesReferences: finalResults
        }
    } catch (error) {
        console.error("Error in askQuestion:", error)
        stream.error("Failed to process question")
        throw error
    }
}

/**
 * Apply keyword-based boosting to results
 */
function applyKeywordBoosting(results: SearchResult[], question: string): SearchResult[] {
    const questionLower = question.toLowerCase()
    const keywords = questionLower.split(/\s+/).filter(w => w.length > 3)
    
    return results.map(result => {
        let boost = 0
        const fileNameLower = result.fileName.toLowerCase()
        const summaryLower = result.summary.toLowerCase()
        
        // Boost for keyword matches in filename
        keywords.forEach(keyword => {
            if (fileNameLower.includes(keyword)) {
                boost += 0.1
            }
            if (summaryLower.includes(keyword)) {
                boost += 0.05
            }
        })
        
        // Boost for common patterns
        if (questionLower.includes('api') && fileNameLower.includes('api')) {
            boost += 0.15
        }
        if (questionLower.includes('component') && fileNameLower.includes('component')) {
            boost += 0.15
        }
        if (questionLower.includes('auth') && fileNameLower.includes('auth')) {
            boost += 0.15
        }
        if (questionLower.includes('database') && (fileNameLower.includes('db') || fileNameLower.includes('prisma'))) {
            boost += 0.15
        }
        
        // Prefer implementation files over config
        if (!fileNameLower.includes('test') && !fileNameLower.includes('spec')) {
            boost += 0.05
        }
        if (!fileNameLower.includes('.config.') && !fileNameLower.includes('package.json')) {
            boost += 0.05
        }
        
        return {
            ...result,
            similarity: Math.min(1, result.similarity + boost)
        }
    }).sort((a, b) => b.similarity - a.similarity)
}

/**
 * Select diverse results to avoid redundancy
 */
function selectDiverseResults(results: SearchResult[], maxCount: number): SearchResult[] {
    const selected: SearchResult[] = []
    const directoryCounts = new Map<string, number>()
    
    for (const result of results) {
        if (selected.length >= maxCount) break
        
        // Extract directory path
        const parts = result.fileName.split('/')
        const dir = parts.slice(0, -1).join('/') || 'root'
        
        // Limit files from same directory
        const currentCount = directoryCounts.get(dir) || 0
        if (currentCount >= 3) continue
        
        selected.push(result)
        directoryCounts.set(dir, currentCount + 1)
    }
    
    return selected
}

/**
 * Build hierarchical context
 */
function buildContext(results: SearchResult[]): string {
    const groupedByDir = new Map<string, SearchResult[]>()
    
    // Group by directory
    results.forEach(result => {
        const dir = result.fileName.split('/').slice(0, -1).join('/') || 'root'
        if (!groupedByDir.has(dir)) {
            groupedByDir.set(dir, [])
        }
        groupedByDir.get(dir)!.push(result)
    })
    
    // Build context string
    let context = "# CODEBASE CONTEXT\n\n"
    
    groupedByDir.forEach((files, dir) => {
        context += `## Directory: ${dir}\n\n`
        
        files.forEach(file => {
            // Truncate very long code
            const code = file.sourceCode.length > 3000 
                ? file.sourceCode.substring(0, 3000) + "\n... [truncated]"
                : file.sourceCode
                
            context += `### File: ${file.fileName}\n`
            context += `**Summary:** ${file.summary}\n`
            context += `**Relevance:** ${(file.similarity * 100).toFixed(1)}%\n\n`
            context += "```\n"
            context += code
            context += "\n```\n\n"
        })
    })
    
    return context
}

/**
 * Build enhanced prompt
 */
function buildPrompt(question: string, context: string): string {
    return `You are an expert senior software engineer helping developers understand this codebase.

## YOUR TASK
Analyze the provided code context and answer the question accurately and comprehensively.

## GUIDELINES
1. Reference specific files when explaining (e.g., "In src/lib/github.ts, the function...")
2. Provide code examples when helpful
3. Explain clearly for developers who may be new to the codebase
4. If the context doesn't fully answer the question, explain what's missing
5. Suggest related files or areas to explore
6. Be specific and actionable

${context}

## QUESTION
${question}

## YOUR ANSWER
Provide a detailed, accurate answer based on the code context above:`
}
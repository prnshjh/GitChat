

import { GithubRepoLoader } from "@langchain/community/document_loaders/web/github";
import { Document } from "@langchain/core/documents";
import { generateEmbedding, summariseCode } from "./gemini";
import { db } from "~/server/db";

/**
 * Improved chunking strategy for better RAG performance
 */
interface CodeChunk {
    content: string
    startLine: number
    endLine: number
    chunkType: string
}

export const loadGithubRepo = async (repoUrl: string, githubToken?: string) => {
    const loader = new GithubRepoLoader(repoUrl, {
        accessToken: githubToken || process.env.GITHUB_ACCESS_TOKEN as string,
        branch: "main",
        ignoreFiles: [
            "package-lock.json",
            "yarn.lock",
            "pnpm-lock.yaml",
            "bun.lockb",
            ".gitignore",
            ".env.example",
        ],
        recursive: true,
        unknown: "warn",
        maxConcurrency: 5,
    });

    return loader.load();
};

/**
 * Smart chunking: Break large files into meaningful chunks
 */
function chunkDocument(doc: Document): Document[] {
    const content = doc.pageContent
    const maxChunkSize = 2000 // characters
    
    // For small files, return as-is
    if (content.length <= maxChunkSize) {
        return [doc]
    }
    
    // For large files, chunk intelligently
    const chunks: Document[] = []
    const lines = content.split('\n')
    
    // Try to chunk by functions/classes/sections
    const semanticChunks = extractSemanticChunks(lines, maxChunkSize)
    
    semanticChunks.forEach((chunk, index) => {
        chunks.push(new Document({
            pageContent: chunk.content,
            metadata: {
                ...doc.metadata,
                chunkIndex: index,
                totalChunks: semanticChunks.length,
                startLine: chunk.startLine,
                endLine: chunk.endLine,
                chunkType: chunk.chunkType,
            }
        }))
    })
    
    return chunks.length > 0 ? chunks : [doc]
}

/**
 * Extract semantic chunks (functions, classes, logical sections)
 */
function extractSemanticChunks(lines: string[], maxSize: number): CodeChunk[] {
    const chunks: CodeChunk[] = []
    let currentChunk: string[] = []
    let startLine = 0
    let braceCount = 0
    let inFunction = false
    
    lines.forEach((line, index) => {
        currentChunk.push(line)
        
        // Track code blocks
        const openBraces = (line.match(/{/g) || []).length
        const closeBraces = (line.match(/}/g) || []).length
        braceCount += openBraces - closeBraces
        
        // Detect function/class starts
        if (/^(export\s+)?(async\s+)?(function|class|const\s+\w+\s*=\s*(async\s+)?\(|interface|type)\s+\w+/.test(line.trim())) {
            inFunction = true
        }
        
        // Check if we should end this chunk
        const shouldEndChunk = (
            currentChunk.join('\n').length > maxSize ||
            (inFunction && braceCount === 0 && currentChunk.length > 10) ||
            (line.trim() === '' && currentChunk.join('\n').length > maxSize * 0.7)
        )
        
        if (shouldEndChunk) {
            const content = currentChunk.join('\n')
            if (content.trim().length > 50) { // Minimum chunk size
                chunks.push({
                    content,
                    startLine,
                    endLine: index,
                    chunkType: inFunction ? 'function' : 'section'
                })
            }
            currentChunk = []
            startLine = index + 1
            inFunction = false
        }
    })
    
    // Add remaining chunk
    if (currentChunk.length > 0) {
        chunks.push({
            content: currentChunk.join('\n'),
            startLine,
            endLine: lines.length - 1,
            chunkType: 'section'
        })
    }
    
    return chunks
}

/**
 * Enhanced embedding generation with metadata
 */
export const generateEmbeddings = async (docs: Document[]) => {
    console.log(`Generating embeddings for ${docs.length} documents...`)
    
    // Chunk large documents
    const allChunks: Document[] = []
    docs.forEach(doc => {
        const chunks = chunkDocument(doc)
        allChunks.push(...chunks)
    })
    
    console.log(`Created ${allChunks.length} chunks from ${docs.length} documents`)
    
    const results = await Promise.all(
        allChunks.map(async (doc, index) => {
            try {
                // Generate enhanced summary with chunk context
                const summary = await summariseCodeChunk(doc)
                const embedding = await generateEmbedding(summary)

                if (index % 10 === 0) {
                    console.log(`Processed ${index + 1}/${allChunks.length} chunks`)
                }

                return {
                    summary,
                    embedding,
                    sourceCode: doc.pageContent,
                    fileName: doc.metadata.source,
                    chunkIndex: doc.metadata.chunkIndex || 0,
                    chunkType: doc.metadata.chunkType || 'full',
                }
            } catch (error) {
                console.error(`Error processing chunk ${index}:`, error)
                return null
            }
        })
    )

    return results.filter(r => r !== null)
}

/**
 * Enhanced code summarization with chunk awareness
 */
async function summariseCodeChunk(doc: Document): Promise<string> {
    const code = doc.pageContent
    const isChunk = doc.metadata.chunkIndex !== undefined
    const chunkInfo = isChunk 
        ? `This is chunk ${doc.metadata.chunkIndex + 1} of ${doc.metadata.totalChunks} from ${doc.metadata.source}. `
        : ''
    
    try {
        const summary = await summariseCode(doc)
        return chunkInfo + summary
    } catch (error) {
        console.error("Error generating summary:", error)
        // Fallback summary
        return `${chunkInfo}Code section from ${doc.metadata.source}`
    }
}

/**
 * Enhanced indexing with better error handling and progress tracking
 */
export const indexGithubRepo = async (
    projectId: string,
    repoUrl: string,
    githubToken?: string
) => {
    console.log(`Starting indexing for project ${projectId}`)
    
    try {
        // Load documents
        const docs = await loadGithubRepo(repoUrl, githubToken)
        console.log(`Loaded ${docs.length} files from repository`)
        
        // Generate embeddings with chunking
        const allEmbeddings = await generateEmbeddings(docs)
        console.log(`Generated ${allEmbeddings.length} embeddings`)

        // Batch insert for better performance
        const batchSize = 10
        let successCount = 0
        let errorCount = 0

        for (let i = 0; i < allEmbeddings.length; i += batchSize) {
            const batch = allEmbeddings.slice(i, i + batchSize)
            
            const results = await Promise.allSettled(
                batch.map(async (embedding) => {
                    if (!embedding) return

                    const sourceCodeEmbedding = await db.sourceCodeEmbedding.create({
                        data: {
                            summary: embedding.summary,
                            sourceCode: embedding.sourceCode,
                            fileName: embedding.fileName,
                            projectId,
                        },
                    })

                    const vectorString = `[${embedding.embedding.join(",")}]`

                    await db.$executeRaw`
                        UPDATE "SourceCodeEmbedding"
                        SET "summaryEmbedding" = ${vectorString}::vector
                        WHERE "id" = ${sourceCodeEmbedding.id}
                    `
                    
                    return sourceCodeEmbedding
                })
            )
            
            results.forEach(result => {
                if (result.status === 'fulfilled') successCount++
                else errorCount++
            })
            
            console.log(`Processed batch ${Math.floor(i / batchSize) + 1}: ${successCount} success, ${errorCount} errors`)
        }
        
        console.log(`Indexing complete: ${successCount} embeddings created, ${errorCount} errors`)
        return { successCount, errorCount }
        
    } catch (error) {
        console.error("Critical error in indexGithubRepo:", error)
        throw error
    }
}

export const checkCredits = async (repoUrl: string, githubToken?: string) => {
    const docs = await loadGithubRepo(repoUrl, githubToken)
    
    // Estimate chunks for large files
    let totalChunks = 0
    docs.forEach(doc => {
        const chunks = chunkDocument(doc)
        totalChunks += chunks.length
    })
    
    console.log(`Repository will require approximately ${totalChunks} credits (${docs.length} files)`)
    return totalChunks
}
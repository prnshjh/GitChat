"use server";

import { streamText } from "ai";
import { createStreamableValue } from "ai/rsc";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateEmbedding } from "~/lib/gemini";
import { db } from "~/server/db";

interface SearchResult {
  fileName: string;
  sourceCode: string;
  summary: string;
  similarity: number;
}

/**
 * Lazy Google Gemini client
 */
function getGoogle() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("Missing GEMINI_API_KEY");
  }
  return createGoogleGenerativeAI({ apiKey });
}

/**
 * Main RAG Query Function
 */
export async function askQuestion(question: string, projectId: string) {
  const stream = createStreamableValue("");

  try {
    const google = getGoogle();

    /**
     * Step 1: Generate embedding
     */
    const queryVector = await generateEmbedding(question);

    if (!queryVector.length) {
      throw new Error("Embedding failed");
    }

    const vectorQuery = "[" + queryVector.join(",") + "]";

    /**
     * Step 2: Retrieve candidates from DB
     */
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
    `;

    console.log(`Found ${candidates.length} candidates`);

    /**
     * Step 3–5: Improve retrieval
     */
    const scoredResults = applyKeywordBoosting(candidates, question);
    const finalResults = selectDiverseResults(scoredResults, 15);
    const context = buildContext(finalResults);

    console.log(`Using ${finalResults.length} documents`);

    /**
     * Step 6: Streaming response (SAFE)
     */
    (async () => {
      try {
        const { textStream } = await streamText({
          model: google("gemini-2.0-flash"),
          prompt: buildPrompt(question, context),
          temperature: 0.3,
          maxTokens: 2000,
        });

        for await (const delta of textStream) {
          stream.update(delta);
        }

        stream.done();
      } catch (err) {
        console.error("Streaming error:", err);
        stream.error("Streaming failed");
      }
    })();

    return {
      output: stream.value,
      filesReferences: finalResults,
    };
  } catch (error) {
    console.error("askQuestion error:", error);
    stream.error("Failed to process question");
    throw error;
  }
}

/**
 * Keyword boosting
 */
function applyKeywordBoosting(results: SearchResult[], question: string) {
  const questionLower = question.toLowerCase();
  const keywords = questionLower.split(/\s+/).filter((w) => w.length > 3);

  return results
    .map((result) => {
      let boost = 0;

      const fileName = result.fileName.toLowerCase();
      const summary = result.summary.toLowerCase();

      keywords.forEach((k) => {
        if (fileName.includes(k)) boost += 0.1;
        if (summary.includes(k)) boost += 0.05;
      });

      if (questionLower.includes("api") && fileName.includes("api")) boost += 0.15;
      if (questionLower.includes("auth") && fileName.includes("auth")) boost += 0.15;
      if (questionLower.includes("db") && fileName.includes("db")) boost += 0.15;

      if (!fileName.includes("test")) boost += 0.05;
      if (!fileName.includes("config")) boost += 0.05;

      return {
        ...result,
        similarity: Math.min(1, result.similarity + boost),
      };
    })
    .sort((a, b) => b.similarity - a.similarity);
}

/**
 * Diversity selection
 */
function selectDiverseResults(results: SearchResult[], maxCount: number) {
  const selected: SearchResult[] = [];
  const dirMap = new Map<string, number>();

  for (const r of results) {
    if (selected.length >= maxCount) break;

    const dir = r.fileName.split("/").slice(0, -1).join("/") || "root";
    const count = dirMap.get(dir) || 0;

    if (count >= 3) continue;

    selected.push(r);
    dirMap.set(dir, count + 1);
  }

  return selected;
}

/**
 * Context builder
 */
function buildContext(results: SearchResult[]) {
  let context = "# CODEBASE CONTEXT\n\n";

  results.forEach((file) => {
    const code =
      file.sourceCode.length > 3000
        ? file.sourceCode.slice(0, 3000) + "\n... [truncated]"
        : file.sourceCode;

    context += `## ${file.fileName}\n`;
    context += `Summary: ${file.summary}\n`;
    context += `Relevance: ${(file.similarity * 100).toFixed(1)}%\n\n`;
    context += "```\n" + code + "\n```\n\n";
  });

  return context;
}

/**
 * Prompt builder
 */
function buildPrompt(question: string, context: string) {
  return `
You are a senior engineer helping understand a codebase.

${context}

QUESTION:
${question}

ANSWER:
Be precise, reference files, and explain clearly.
`;
}
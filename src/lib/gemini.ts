import { GoogleGenerativeAI } from "@google/generative-ai";
import { Document } from "@langchain/core/documents";

/**
 * ✅ Lazy init (SAFE)
 */
function getGenAI() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set");
  }
  return new GoogleGenerativeAI(apiKey);
}

/**
 * ✅ Model factory
 */
function getFlashModel() {
  const genAI = getGenAI();
  return genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
  });
}

/**
 * Summarise commit
 */
export const aiSummariseCommit = async (diff: string) => {
  const model = getFlashModel();

  const result = await model.generateContent([
    `You are an expert programmer summarizing a git diff.`,
    `Please summarise:\n\n${diff}`,
  ]);

  return result.response.text();
};

/**
 * Summarise code
 */
export async function summariseCode(doc: Document) {
  const code = doc.pageContent.slice(0, 10000);

  try {
    const model = getFlashModel();

    const result = await model.generateContent([
      `Explain the purpose of ${doc.metadata.source} file:
---
${code}
---
Max 100 words.`,
    ]);

    return result.response.text();
  } catch (error) {
    console.error("summariseCode error:", error);
    return "";
  }
}

/**
 * Generate embedding
 */
export async function generateEmbedding(summary: string) {
  try {
    const genAI = getGenAI();

    const embeddingModel = genAI.getGenerativeModel({
      model: "text-embedding-004",
    });

    const result = await embeddingModel.embedContent(summary);

    return result.embedding?.values || [];
  } catch (err) {
    console.error("Embedding error:", err);
    return [];
  }
}
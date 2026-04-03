"use server";

import { streamText } from "ai";
import { createStreamableValue } from "ai/rsc";
import { createGoogleGenerativeAI } from "@ai-sdk/google";

/**
 * ✅ Lazy Google client (NO top-level crash)
 */
function getGoogle() {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("Missing GEMINI_API_KEY");
  }

  return createGoogleGenerativeAI({ apiKey });
}

/**
 * ✅ MAIN FUNCTION (name fixed → askQuestion)
 */
export async function askQuestion(question: string) {
  const stream = createStreamableValue("");

  try {
    const google = getGoogle();

    const prompt = `
You are a helpful AI assistant.

User Question:
${question}

Answer clearly and concisely:
`;

    /**
     * ✅ Safe streaming (no silent crash)
     */
    (async () => {
      try {
        const { textStream } = await streamText({
          model: google("gemini-2.0-flash"),
          prompt,
          temperature: 0.7,
          maxTokens: 1000,
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
    };
  } catch (error) {
    console.error("askQuestion error:", error);
    stream.error("Failed to process question");
    throw error;
  }
}
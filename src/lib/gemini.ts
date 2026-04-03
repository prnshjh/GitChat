import { GoogleGenerativeAI } from "@google/generative-ai";

/**
 * Lazy Gemini client
 */
function getGenAI() {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set");
  }

  return new GoogleGenerativeAI(apiKey);
}

/**
 * Simple text generation (non-streaming)
 */
export async function generateSimpleText(prompt: string) {
  try {
    const genAI = getGenAI();

    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
    });

    const result = await model.generateContent(prompt);

    return result.response.text();
  } catch (err) {
    console.error("Gemini simple error:", err);
    return "Error generating response";
  }
}
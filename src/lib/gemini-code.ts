"use server"

import { GoogleGenerativeAI } from "@google/generative-ai"
import { createStreamableValue } from "ai/rsc"

// Ensure GEMINI_API_KEY is in your .env file
const apiKey = process.env.GEMINI_API_KEY

if (!apiKey) {
  throw new Error("Missing GEMINI_API_KEY in environment variables.")
}

const genAI = new GoogleGenerativeAI(apiKey)

export type GenerateCodePayload = {
  prompt: string
  language: string
  filename?: string
}

export async function generateCodeStream(payload: GenerateCodePayload) {
  const { prompt, language } = payload

  // 1. Create a streamable value to send chunks to the client
  const stream = createStreamableValue("")

  // 2. Start the generation process asynchronously
  ;(async () => {
    try {
      // Use the requested 2.5 Flash model
      const model = genAI.getGenerativeModel({ 
        model: "gemini-2.5-flash" 
      })

      const systemInstruction = `
        You are an expert Senior Software Engineer specializing in ${language}.
        
        RULES:
        1. Return ONLY the raw code.
        2. Do NOT wrap the code in Markdown blocks (no \`\`\` or \`\`\`${language}).
        3. Do NOT add introductory or concluding text.
        4. Include helpful comments within the code.
        5. Ensure the code is production-ready and modern.
      `

      const streamingResponse = await model.generateContentStream({
        contents: [
          { role: "model", parts: [{ text: systemInstruction }] },
          { role: "user", parts: [{ text: prompt }] }
        ],
      })

      // 3. Iterate over the Gemini stream and update the streamable value
      for await (const item of streamingResponse.stream) {
        const chunk = item.text()
        if (chunk) {
          stream.update(chunk)
        }
      }

      // 4. Mark the stream as done
      stream.done()
    } catch (error: any) {
      console.error("Gemini Generation Error:", error)
      // Pass the error to the client
      stream.error("Failed to generate code via Gemini 2.5 Flash.") 
    }
  })()

  // 5. Return the stream container immediately
  return { output: stream.value }
}
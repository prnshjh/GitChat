// import { GoogleGenerativeAI } from "@google/generative-ai";
// import { Document } from "@langchain/core/documents";
  
//   const apiKey = process.env.GEMINI_API_KEY;
//   const genAI = new GoogleGenerativeAI(apiKey as string);
  
//   const model = genAI.getGenerativeModel({
//     model: "gemini-2.5-flash",
//   });
  

//   export const aiSummariseCommit = async (diff: string) => {
//     const response = await model.generateContent([
//         `You are an expert programmer, and you are trying to summarize a git diff.
//     Reminders about the git diff format:
//     For every file, there are a few metadata lines, like (for example):
//     \`\`\`
//     diff --git a/lib/index.js b/lib/index.js
//     index aadf691..bfef603 100644
//     --- a/lib/index.js
//     +++ b/lib/index.js
//     \`\`\`
//     This means that \`lib/index.js\` was modified in this commit. Note that this is only an example.
//     Then there is a specifier of the lines that were modified.
//     A line starting with \`+\` means it was added.
//     A line that starting with \`-\` means that line was deleted.
//     A line that starts with neither \`+\` nor \`-\` is code given for context and better understanding.
//     It is not part of the diff.
//     [...]
//     EXAMPLE SUMMARY COMMENTS:
//     \`\`\`
//     * Raised the amount of returned recordings from \`10\` to \`100\` [packages/server/recordings_api.ts], [packages/server/constants.ts]
//     * Fixed a typo in the github action name [.github/workflows/gpt-commit-summarizer.yml]
//     * Moved the \`octokit\` initialization to a separate file [src/octokit.ts], [src/index.ts]
//     * Added an OpenAI API for completions [packages/utils/apis/openai.ts]
//     * Lowered numeric tolerance for test files
//     \`\`\`
//     Most commits will have less comments than this examples list.
//     The last comment does not include the file names,
//     because there were more than two relevant files in the hypothetical commit.
//     Do not include parts of the example in your summary.
//     It is given only as an example of appropriate comments.`,
//     `Please summarise the following diff file: \n\n${diff}`
//     ])
//     return response.response.text();
//   }
  

//   export async function summariseCode(doc: Document) {
//       const code = doc.pageContent.slice(0, 10000);
//       console.log("summarise code ----------------------")
//       // console.log("source", doc.metadata);
//       console.log("source code:", code);
//       try {
//         const response = await model.generateContent([
//           `You are an intelligent senior software engineer who specializes in onboarding junior software engineers onto projects. 
//           You are onboarding a junior software engineer and explaining to them the purpose of the ${doc.metadata.source} file.
//           Here is the code:
//           ---
//           ${code}
//           ---
//           Please provide a summary of the code above in no more than 100 words.`
//         ]);
//         return response.response.text();
//       } catch (error) {
//         // console.error("Error generating content:", error);
//         return "";
//       }
//   }

//   export async function generateEmbedding(summary: string) {
//     const model= genAI.getGenerativeModel({
//         model: "text-embedding-004",  
        
//     })
//     const result = await model.embedContent(summary)
//     const embedding = result.embedding;
//     return embedding.values;
//   }
import { GoogleGenerativeAI } from "@google/generative-ai";
import { Document } from "@langchain/core/documents";
 
// The SDK client will automatically look for GEMINI_API_KEY environment variable.
const apiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey as string);
 
// The generative model remains "gemini-2.5-flash"
const flashModel = genAI.getGenerativeModel({
  model: "gemini-2.5-flash",
});
 

export const aiSummariseCommit = async (diff: string) => {
  const response = await flashModel.generateContent([
    `You are an expert programmer, and you are trying to summarize a git diff.
    Reminders about the git diff format:
    For every file, there are a few metadata lines, like (for example):
    \`\`\`
    diff --git a/lib/index.js b/lib/index.js
    index aadf691..bfef603 100644
    --- a/lib/index.js
    +++ b/lib/index.js
    \`\`\`
    This means that \`lib/index.js\` was modified in this commit. Note that this is only an example.
    Then there is a specifier of the lines that were modified.
    A line starting with \`+\` means it was added.
    A line that starting with \`-\` means that line was deleted.
    A line that starts with neither \`+\` nor \`-\` is code given for context and better understanding.
    It is not part of the diff.
    [...]
    EXAMPLE SUMMARY COMMENTS:
    \`\`\`
    * Raised the amount of returned recordings from \`10\` to \`100\` [packages/server/recordings_api.ts], [packages/server/constants.ts]
    * Fixed a typo in the github action name [.github/workflows/gpt-commit-summarizer.yml]
    * Moved the \`octokit\` initialization to a separate file [src/octokit.ts], [src/index.ts]
    * Added an OpenAI API for completions [packages/utils/apis/openai.ts]
    * Lowered numeric tolerance for test files
    \`\`\`
    Most commits will have less comments than this examples list.
    The last comment does not include the file names,
    because there were more than two relevant files in the hypothetical commit.
    Do not include parts of the example in your summary.
    It is given only as an example of appropriate comments.`,
    `Please summarise the following diff file: \n\n${diff}`
  ])
  // Updated: Access response text using response.text
  return response.text;
}
 

export async function summariseCode(doc: Document) {
  const code = doc.pageContent.slice(0, 10000);
  console.log("summarise code ----------------------")
  // console.log("source", doc.metadata);
  console.log("source code:", code);
  try {
    const response = await flashModel.generateContent([
      `You are an intelligent senior software engineer who specializes in onboarding junior software engineers onto projects. 
      You are onboarding a junior software engineer and explaining to them the purpose of the ${doc.metadata.source} file.
      Here is the code:
      ---
      ${code}
      ---
      Please provide a summary of the code above in no more than 100 words.`
    ]);
    // Updated: Access response text using response.text
    return response.text;
  } catch (error) {
    // console.error("Error generating content:", error);
    return "";
  }
}

export async function generateEmbedding(summary: string) {
  // Using the model initialized in the function body, as in the original logic.
  // Model name is already correct for the current recommended embedding model.
  const embeddingModel = genAI.getGenerativeModel({
      model: "text-embedding-004",  
  })
  const result = await embeddingModel.embedContent(summary)
  
  // The structure is already correct: result.embedding.values
  return result.embedding.values;
}
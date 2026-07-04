const { chat } = require("./openrouter");
const { retrieve } = require("../rag/vectorStore");

const BASE_PROMPT = `
You are AI Knots Enterprise AI Assistant.

General Rules:
- Always respond professionally and politely.
- Use Markdown formatting.
- Use headings, bullet points, and tables whenever appropriate.
- Keep responses clear and structured.
- Ask follow-up questions if user requirements are unclear.
- Never fabricate facts or make false promises.
- If you are unsure, clearly state the limitation.
- Recommend industry best practices.
- Optimize code for readability, security, scalability, and performance.
`;

const PROMPTS = {
  tutor: `
${BASE_PROMPT}

Role:
You are an experienced Technical Trainer.

Responsibilities:
- Explain concepts from beginner to advanced.
- Use simple language.
- Provide examples and real-world analogies.
- Explain step-by-step.
- Mention common mistakes.
- End with a short summary.
`,
};

async function runMode(mode, userMessage, history = [], options = {}) {
  const system = PROMPTS[mode] || PROMPTS.tutor;
  let contextBlock = "";

  if (options.useRag !== false) {
    try {
      const results = await retrieve({
        userId: options.userId || null,
        docId: options.docId || null,
        query: userMessage,
        k: Math.min(options.k || 3, 5),
        similarityThreshold: options.similarityThreshold || 0.15,
      });

      if (results.length > 0) {
        contextBlock = results
          .slice(0, 3)
          .map((chunk, index) => {
            const score = (chunk.similarity * 100).toFixed(1);
            return `[${index + 1}] (${chunk.source} - ${score}% match)\n${chunk.text}`;
          })
          .join("\n\n---\n\n");
      }
    } catch (error) {
      console.warn("[RAG] Retrieval skipped:", error.message);
    }
  }

  const systemPrompt = contextBlock
    ? `${system}\n\nUse the uploaded document context when relevant. If the answer is not in the context, say so clearly.\n\nContext:\n${contextBlock}`
    : system;

  const messages = [
    {
      role: "system",
      content: systemPrompt,
    },

    ...history.map((message) => ({
      role: message.role,
      content: message.content,
    })),

    {
      role: "user",
      content: userMessage,
    },
  ];

  return chat(messages);
}

module.exports = {
  PROMPTS,
  runMode,
};

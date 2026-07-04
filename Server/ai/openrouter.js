// AI Service Client for local Ollama only
const axios = require("axios");

const AI_PROVIDER = process.env.AI_PROVIDER || "ollama";
const DEFAULT_MODEL = process.env.OLLAMA_MODEL || "llama3.2:3b";
const DEFAULT_TIMEOUT_MS = Number(process.env.OLLAMA_TIMEOUT_MS || 300000);
const ollamaHttp = axios.create({
  baseURL: process.env.OLLAMA_BASE_URL || "http://localhost:11434",
  headers: { "Content-Type": "application/json" },
  timeout: DEFAULT_TIMEOUT_MS,
});

async function ollamaChat(messages, { temperature = 0.7, maxTokens } = {}) {
  try {
    const model = DEFAULT_MODEL;
    const requestedMaxTokens = Number(maxTokens) || 220;
    const resp = await ollamaHttp.post("/api/chat", {
      model,
      messages,
      temperature,
      stream: false,
      options: {
        num_predict: Math.min(requestedMaxTokens, 220),
        num_ctx: 2048,
      },
    });

    return (
      resp.data.message?.content ?? "Sorry, I could not generate a response."
    );
  } catch (error) {
    console.error("🚨 Ollama Error:", error.message);

    if (error.code === "ECONNREFUSED" || error.code === "ECONNRESET") {
      throw new Error("Ollama is not running. Start Ollama: ollama serve");
    }

    if (error.response?.status === 404 || error.response?.status === 400) {
      throw new Error(
        `Ollama model '${DEFAULT_MODEL}' is not available. Install it with: ollama pull ${DEFAULT_MODEL}`,
      );
    }

    if (
      error.code === "ECONNABORTED" ||
      error.message?.includes("timeout") ||
      error.message?.includes("timed out")
    ) {
      console.warn("[AI] Ollama timed out; returning a short fallback reply.");
      return "The model is taking longer than expected. Please try again in a moment.";
    }

    throw new Error(error.message || "Ollama service unavailable");
  }
}

async function chat(messages, options = {}) {
  if (AI_PROVIDER === "ollama") {
    return ollamaChat(messages, options);
  }

  throw new Error(`Unknown AI provider: ${AI_PROVIDER}`);
}

function localHashEmbed(text) {
  const dims = 256;
  const v = new Array(dims).fill(0);
  const tokens =
    String(text)
      .toLowerCase()
      .match(/[a-z0-9]+/g) || [];
  for (const t of tokens) {
    let h = 2166136261;
    for (let i = 0; i < t.length; i++) {
      h ^= t.charCodeAt(i);
      h = (h * 16777619) >>> 0;
    }
    v[h % dims] += 1;
  }
  const norm = Math.sqrt(v.reduce((s, x) => s + x * x, 0)) || 1;
  return v.map((x) => x / norm);
}

async function embed(texts) {
  return texts.map(localHashEmbed);
}

module.exports = { chat, embed };

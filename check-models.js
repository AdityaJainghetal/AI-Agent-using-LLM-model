#!/usr/bin/env node

/**
 * Check available Ollama models and suggest which to use
 */

const axios = require("axios");

const OLLAMA_BASE = process.env.OLLAMA_BASE_URL || "http://localhost:11434";

async function checkModels() {
  console.log("\n📦 Checking available Ollama models...\n");

  try {
    const resp = await axios.get(`${OLLAMA_BASE}/api/tags`, { timeout: 5000 });
    const models = resp.data.models || [];

    if (models.length === 0) {
      console.log("❌ No models found!\n");
      console.log("Download a model with one of:");
      console.log("  ollama pull mistral      (fast, small, recommended)");
      console.log("  ollama pull neural-chat  (good quality)");
      console.log("  ollama pull llama2       (good general purpose)");
      console.log("  ollama pull orca-mini    (very fast, tiny)");
      return;
    }

    console.log(`✅ Found ${models.length} model(s):\n`);
    models.forEach((m, i) => {
      const size = m.size ? ` (${(m.size / 1e9).toFixed(1)}GB)` : "";
      console.log(`  ${i + 1}. ${m.name}${size}`);
    });

    const recommended = models[0].name;
    console.log(`\n✨ Recommended for .env: OLLAMA_MODEL=${recommended}`);

    console.log("\n📝 Update Server/.env and set:");
    console.log(`  OLLAMA_MODEL=${recommended}\n`);
  } catch (error) {
    if (error.code === "ECONNREFUSED") {
      console.log("❌ Ollama is not running!\n");
      console.log("Start Ollama with: ollama serve\n");
    } else {
      console.log(`❌ Error: ${error.message}\n`);
    }
    process.exit(1);
  }
}

checkModels();

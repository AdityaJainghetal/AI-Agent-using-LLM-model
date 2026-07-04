#!/usr/bin/env node

/**
 * 🧹 EduForge Backend Cleanup Script
 *
 * Removes unused duplicate files and directories
 * Reorganizes code for clarity
 */

const fs = require("fs");
const path = require("path");

const baseDir = __dirname;

// Files and directories to remove (SAFE - verified as unused)
const toRemove = [
  // Old duplicate route files (replaced by newer versions in /routes)
  "Server/models/aiRoutes.js",
  "Server/models/authRoutes.js",
  "Server/models/ragRoutes.js",

  // Old unused entry point (replaced by server.js)
  "Server/index.js",

  // Old duplicate controller directory (replaced by /controllers)
  "Server/controller",
];

console.log("\n🧹 EduForge Backend Cleanup\n");
console.log("═".repeat(50));

let removed = 0;
let errors = 0;

toRemove.forEach((filePath) => {
  const fullPath = path.join(baseDir, filePath);

  try {
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      // Remove directory recursively
      fs.rmSync(fullPath, { recursive: true, force: true });
      console.log(`✅ Removed directory: ${filePath}`);
      removed++;
    } else if (stat.isFile()) {
      // Remove file
      fs.unlinkSync(fullPath);
      console.log(`✅ Removed file: ${filePath}`);
      removed++;
    }
  } catch (error) {
    if (error.code === "ENOENT") {
      console.log(`⚠️  Not found (already removed?): ${filePath}`);
    } else {
      console.error(`❌ Error removing ${filePath}: ${error.message}`);
      errors++;
    }
  }
});

console.log("\n" + "═".repeat(50));
console.log(
  `✅ Cleanup complete: ${removed} items removed, ${errors} errors\n`,
);

// Print new structure
console.log("📂 New Backend Structure:\n");
console.log(`
Server/
├── server.js          ← MAIN ENTRY POINT
├── app.js             ← Express setup
├── .env
├── package.json
│
├── config/
│   └── db.js
│
├── middlewares/       ← Auth, error handling
│   ├── auth.js
│   ├── errorHandler.js
│   └── validate.js
│
├── models/            ← Database models ONLY
│   ├── User.js
│   ├── Chat.js
│   ├── Document.js
│   ├── AgentRun.js
│   ├── Assignment.js
│   └── Submission.js
│
├── routes/            ← API routes (NO duplicates)
│   ├── authRoutes.js
│   ├── userRoutes.js
│   ├── aiRoutes.js
│   ├── ragRoutes.js
│   ├── agentRoutes.js
│   └── adminRoutes.js
│
├── controllers/       ← SINGLE directory, no /controller
│   ├── authController.js
│   ├── userController.js
│   ├── aiController.js
│   ├── ragController.js
│   ├── agentController.js
│   ├── adminController.js
│   └── userController.js
│
├── ai/                ← AI providers
│   ├── openrouter.js  (Ollama + OpenRouter)
│   └── prompts.js     (System prompts)
│
├── rag/               ← Vector search
│   ├── vectorStore.js
│   └── loader.js
│
├── agents/            ← Agent utilities
│   └── ...
│
├── seeds/             ← Database seeds
│   └── adminSeed.js
│
└── uploads/           ← User files
    └── ...
`);

console.log("🚀 Next step: npm run dev\n");

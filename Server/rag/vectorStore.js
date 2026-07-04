const path = require("path");
const fs = require("fs");
const { v4: uuidv4 } = require("uuid");
const Document = require("../models/Document");
const {
  extractText,
  chunkText,
  recursiveCharacterSplit,
  semanticSplit,
} = require("./loader");
const { embed, chat } = require("../ai/openrouter");

// In-memory vector storage (alternative to Chroma for simplicity)
// In production, use Chroma-js or connect to Chroma server
const vectorStores = new Map();

/**
 * Initialize or get vector store for a user
 */
function getVectorStore(userId) {
  if (!vectorStores.has(userId)) {
    vectorStores.set(userId, {
      documents: [],
      vectors: [],
      metadata: [],
    });
  }
  return vectorStores.get(userId);
}

/**
 * Calculate cosine similarity between two vectors
 */
function cosineSimilarity(a, b) {
  if (!a || !b || a.length !== b.length) return 0;

  let dot = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  const denominator = Math.sqrt(normA) * Math.sqrt(normB);
  return denominator === 0 ? 0 : dot / denominator;
}

/**
 * Ingest a document file using RAG methodology
 * 1. Extract text from file
 * 2. Split into optimized chunks
 * 3. Generate embeddings for each chunk
 * 4. Store in vector store with metadata
 */
async function ingestFile({
  userId,
  courseId,
  filename,
  filePath,
  fileUrl,
  mimeType,
  title,
  chunkStrategy = "recursive",
}) {
  try {
    console.log(`[RAG] Ingesting file: ${filename}`);

    // Step 1: Extract text
    const text = await extractText(filePath, mimeType);
    if (!text || text.trim().length === 0) {
      throw new Error("No text content extracted from file");
    }

    // Step 2: Split text into chunks using RAG strategy
    console.log(`[RAG] Splitting text using ${chunkStrategy} strategy`);
    const chunks = chunkText(text, chunkStrategy, 1000, 100);

    if (chunks.length === 0) {
      throw new Error("No chunks generated from text");
    }

    console.log(`[RAG] Generated ${chunks.length} chunks`);

    // Step 3: Generate embeddings for each chunk
    console.log(`[RAG] Generating embeddings for ${chunks.length} chunks`);
    let embeddings = [];
    try {
      embeddings = await embed(chunks);
    } catch (err) {
      console.warn(
        "[RAG] Embedding generation failed, using local embeddings:",
        err.message,
      );
      embeddings = chunks.map((chunk) => localHashEmbed(chunk));
    }

    // Step 4: Create document with chunks in MongoDB
    const docChunks = chunks.map((text, index) => ({
      id: uuidv4(),
      text: text.trim(),
      embedding: embeddings[index] || localHashEmbed(text),
      index: index,
      metadata: {
        filename,
        chunkIndex: index,
        totalChunks: chunks.length,
        sourceTitle: title || filename,
      },
    }));

    const doc = await Document.create({
      user: userId,
      course: courseId,
      title: title || filename,
      filename,
      fileUrl,
      mimeType,
      chunks: docChunks,
      metadata: {
        strategy: chunkStrategy,
        totalChunks: chunks.length,
        textLength: text.length,
      },
    });

    console.log(`[RAG] Successfully ingested document: ${doc._id}`);

    return {
      _id: doc._id,
      title: doc.title,
      chunks: doc.chunks.length,
      status: "ingested",
    };
  } catch (error) {
    console.error("[RAG] Ingestion error:", error);
    throw error;
  }
}

/**
 * Retrieve relevant chunks using semantic similarity
 * Uses cosine similarity to find most relevant chunks
 */
async function retrieve({
  userId,
  docId = null,
  query,
  k = 5,
  similarityThreshold = 0.3,
}) {
  try {
    console.log(
      `[RAG] Retrieving context for query: "${query.substring(0, 50)}..."`,
    );

    // Get query embedding
    let queryEmbedding;
    try {
      const embeddings = await embed([query]);
      queryEmbedding = embeddings[0];
    } catch (err) {
      console.warn(
        "[RAG] Query embedding failed, using local embedding:",
        err.message,
      );
      queryEmbedding = localHashEmbed(query);
    }

    // Build query filter
    const filter = { user: userId };
    if (docId) {
      filter._id = docId;
    }

    // Fetch documents
    const documents = await Document.find(filter).limit(50);

    if (documents.length === 0) {
      console.warn("[RAG] No documents found for retrieval");
      return [];
    }

    // Score all chunks using cosine similarity
    const scored = [];
    for (const doc of documents) {
      for (const chunk of doc.chunks) {
        if (!chunk.embedding || chunk.embedding.length === 0) {
          continue;
        }

        const similarity = cosineSimilarity(queryEmbedding, chunk.embedding);

        if (similarity >= similarityThreshold) {
          scored.push({
            id: chunk.id,
            text: chunk.text,
            similarity: similarity,
            source: doc.title || doc.filename,
            documentId: doc._id,
            chunkIndex: chunk.index,
            metadata: chunk.metadata,
          });
        }
      }
    }

    // Sort by similarity score and return top k
    scored.sort((a, b) => b.similarity - a.similarity);
    const results = scored.slice(0, k);

    console.log(`[RAG] Retrieved ${results.length} relevant chunks`);

    return results;
  } catch (error) {
    console.error("[RAG] Retrieval error:", error);
    throw error;
  }
}

/**
 * Ask a question about documents using RAG with context
 * 1. Retrieve relevant chunks
 * 2. Build context from retrieved chunks
 * 3. Generate answer using context
 */
async function askWithContext({
  userId,
  docId = null,
  query,
  k = 5,
  systemPrompt = null,
}) {
  try {
    console.log("[RAG] Processing RAG question...");

    // Step 1: Retrieve relevant context
    const retrievedChunks = await retrieve({
      userId,
      docId,
      query,
      k,
      similarityThreshold: 0.2,
    });

    if (retrievedChunks.length === 0) {
      return {
        answer:
          "I could not find relevant information in the uploaded documents to answer your question.",
        sources: [],
        message: "No relevant context found",
      };
    }

    // Step 2: Build context block from retrieved chunks
    const contextBlock = retrievedChunks
      .map((chunk, i) => {
        const source = chunk.source || "Unknown Source";
        const similarity = (chunk.similarity * 100).toFixed(1);
        return `[${i + 1}] (${source} - ${similarity}% match)\n${chunk.text}`;
      })
      .join("\n\n---\n\n");

    // Step 3: Build messages for LLM
    const defaultSystemPrompt = `You are a helpful assistant that answers questions based on provided context. 
Your rules:
1. Answer ONLY based on the provided context
2. Cite the sources using [1], [2], etc. when referencing specific information
3. If the answer is not in the context, say "I cannot find this information in the provided documents"
4. Be concise and direct
5. Maintain accuracy - don't speculate beyond what's in the context`;

    const messages = [
      {
        role: "system",
        content: systemPrompt || defaultSystemPrompt,
      },
      {
        role: "user",
        content: `Context from documents:\n${contextBlock}\n\nQuestion: ${query}`,
      },
    ];

    // Step 4: Generate answer using chat
    console.log("[RAG] Generating answer with context...");
    const answer = await chat(messages);

    return {
      answer: answer || "Unable to generate answer",
      sources: retrievedChunks.map((c) => ({
        text: c.text.substring(0, 200) + "...",
        source: c.source,
        similarity: c.similarity,
        documentId: c.documentId,
      })),
      chunksUsed: retrievedChunks.length,
      avgSimilarity: (
        retrievedChunks.reduce((sum, c) => sum + c.similarity, 0) /
        retrievedChunks.length
      ).toFixed(3),
    };
  } catch (error) {
    console.error("[RAG] Question answering error:", error);
    throw error;
  }
}

/**
 * Local embedding function using hash-based approach
 * Fallback when API embeddings are not available
 * Generates consistent 384-dimensional vectors
 */
function localHashEmbed(text) {
  const dims = 384; // Increased dimension for better similarity
  const vector = new Array(dims).fill(0);

  // Tokenize text
  const tokens = String(text)
    .toLowerCase()
    .split(/[\s\W]+/)
    .filter((t) => t.length > 0);

  // Hash each token into vector space
  for (const token of tokens) {
    let hash = 2166136261; // FNV-1a offset basis

    for (let i = 0; i < token.length; i++) {
      hash ^= token.charCodeAt(i);
      hash = (hash * 16777619) >>> 0; // FNV-1a prime
    }

    // Distribute hash into dimensions
    vector[hash % dims] += 1;
  }

  // Normalize vector (L2 normalization)
  const norm = Math.sqrt(vector.reduce((sum, x) => sum + x * x, 0)) || 1;
  return vector.map((x) => x / norm);
}

/**
 * Delete a document from vector store
 */
async function deleteDocument(userId, docId) {
  try {
    const doc = await Document.findOneAndDelete({
      _id: docId,
      user: userId,
    });

    if (!doc) {
      throw new Error("Document not found");
    }

    console.log(`[RAG] Deleted document: ${docId}`);
    return { success: true, deletedChunks: doc.chunks.length };
  } catch (error) {
    console.error("[RAG] Document deletion error:", error);
    throw error;
  }
}

/**
 * Get document statistics
 */
async function getDocumentStats(userId, docId) {
  try {
    const doc = await Document.findOne({
      _id: docId,
      user: userId,
    });

    if (!doc) {
      throw new Error("Document not found");
    }

    return {
      title: doc.title,
      filename: doc.filename,
      totalChunks: doc.chunks.length,
      metadata: doc.metadata || {},
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    };
  } catch (error) {
    console.error("[RAG] Statistics error:", error);
    throw error;
  }
}

module.exports = {
  ingestFile,
  retrieve,
  askWithContext,
  deleteDocument,
  getDocumentStats,
  localHashEmbed,
  cosineSimilarity,
};

const fs = require("fs");
const path = require("path");
const pdfParse = require("pdf-parse");
const mammoth = require("mammoth");

/**
 * Extract text from various file formats
 */
async function extractText(filePath, mimeType = "") {
  const ext = path.extname(filePath).toLowerCase();
  const buf = fs.readFileSync(filePath);

  if (ext === ".pdf" || mimeType.includes("pdf")) {
    const data = await pdfParse(buf);
    return data.text || "";
  }

  if (ext === ".docx" || mimeType.includes("word")) {
    const res = await mammoth.extractRawText({ buffer: buf });
    return res.value || "";
  }

  // txt / md / fallback
  return buf.toString("utf8");
}

/**
 * Split text into sentences (basic natural breaking points)
 */
function splitIntoSentences(text) {
  // Split by common sentence endings while preserving the delimiter
  return text.split(/(?<=[.!?])\s+/).filter((s) => s.trim().length > 0);
}

/**
 * Recursive Character Split - splits text recursively by different delimiters
 * This is a RAG-optimized chunking strategy that preserves semantic meaning
 */
function recursiveCharacterSplit(
  text,
  separators = ["\n\n", "\n", ". ", " "],
  chunkSize = 1000,
  chunkOverlap = 100,
) {
  const chunks = [];
  let goodSeparators = [];

  // Find the most effective separator
  for (const sep of separators) {
    if (sep === "") {
      goodSeparators = separators;
      break;
    }
    if (text.includes(sep)) {
      goodSeparators.push(sep);
    }
  }

  if (!goodSeparators.length) {
    goodSeparators = [" "];
  }

  // Split by the first separator that exists
  let splits = [text];
  for (const sep of goodSeparators) {
    if (splits[splits.length - 1].length <= chunkSize) {
      break;
    }

    const newSplits = [];
    for (const split of splits) {
      if (split.length <= chunkSize) {
        newSplits.push(split);
      } else {
        const newSplit = split.split(sep);
        newSplits.push(...newSplit);
      }
    }
    splits = newSplits;
  }

  // Create chunks with overlap
  let goodChunks = [];
  for (const split of splits) {
    if (split.trim().length > 0) {
      goodChunks.push(split);
    }
  }

  // Merge chunks to reach desired chunk size
  let mergedText = "";
  for (const chunk of goodChunks) {
    const addLen = chunk.length + 1; // +1 for separator

    if (mergedText.length + addLen > chunkSize && mergedText.length > 0) {
      // Save current chunk and start new one
      if (mergedText.trim()) {
        chunks.push(mergedText.trim());
      }
      // Create overlap: use last part of previous chunk
      mergedText = mergedText.slice(-chunkOverlap) + "\n" + chunk;
    } else {
      if (mergedText) {
        mergedText += "\n" + chunk;
      } else {
        mergedText = chunk;
      }
    }
  }

  // Add final chunk
  if (mergedText.trim()) {
    chunks.push(mergedText.trim());
  }

  return chunks.filter((c) => c.length > 0);
}

/**
 * Semantic Character Split - smarter splitting that preserves paragraph context
 * Ideal for documents with structure (headers, sections, etc.)
 */
function semanticSplit(text, chunkSize = 1000, chunkOverlap = 100) {
  // First pass: split by double newlines (paragraphs)
  const paragraphs = text.split(/\n\n+/).filter((p) => p.trim().length > 0);

  const chunks = [];
  let currentChunk = "";

  for (const para of paragraphs) {
    const paraLength = para.length;
    const currentLength = currentChunk.length;

    if (currentLength + paraLength + 1 > chunkSize && currentChunk.length > 0) {
      // Push current chunk and start overlap
      chunks.push(currentChunk.trim());

      // Create overlap with end of previous chunk
      const overlapText = currentChunk.slice(-chunkOverlap);
      currentChunk = overlapText + "\n\n" + para;
    } else {
      if (currentChunk) {
        currentChunk += "\n\n" + para;
      } else {
        currentChunk = para;
      }
    }
  }

  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }

  return chunks.filter((c) => c.trim().length > 100); // Filter very small chunks
}

/**
 * Main chunking function - uses best strategy based on text structure
 * Returns chunks optimized for RAG retrieval
 */
function chunkText(
  text,
  strategy = "recursive",
  chunkSize = 1000,
  chunkOverlap = 100,
) {
  if (!text || text.trim().length === 0) {
    return [];
  }

  // Clean text: normalize whitespace but preserve structure
  let cleanText = text
    .replace(/\r\n/g, "\n") // Normalize line endings
    .replace(/\n{3,}/g, "\n\n") // Reduce multiple newlines
    .trim();

  let chunks = [];

  if (strategy === "semantic") {
    // Use semantic splitting for structured documents
    chunks = semanticSplit(cleanText, chunkSize, chunkOverlap);
  } else if (strategy === "recursive") {
    // Use recursive splitting for general purpose
    chunks = recursiveCharacterSplit(
      cleanText,
      ["\n\n", "\n", ". ", " "],
      chunkSize,
      chunkOverlap,
    );
  } else if (strategy === "simple") {
    // Legacy simple splitting
    const cleanSimple = cleanText.replace(/\s+/g, " ");
    chunks = [];
    let i = 0;
    while (i < cleanSimple.length) {
      chunks.push(cleanSimple.slice(i, i + chunkSize));
      i += chunkSize - chunkOverlap;
    }
  }

  return chunks.filter((c) => c.trim().length > 0).map((c) => c.trim());
}

module.exports = {
  extractText,
  chunkText,
  recursiveCharacterSplit,
  semanticSplit,
  splitIntoSentences,
};

const path = require("path");
const Document = require("../models/Document");
const {
  ingestFile,
  retrieve,
  askWithContext,
  deleteDocument,
  getDocumentStats,
} = require("../rag/vectorStore");

/**
 * Upload and ingest a document for RAG
 */
exports.upload = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const { title, chunkStrategy = "recursive" } = req.body;

    console.log(`[RAG] Uploading file: ${req.file.originalname}`);

    const result = await ingestFile({
      userId: req.user._id,
      courseId: req.body.courseId || null,
      filename: req.file.originalname,
      filePath: req.file.path,
      fileUrl: `/uploads/notes/${req.file.filename}`,
      mimeType: req.file.mimetype,
      title: title || req.file.originalname,
      chunkStrategy: chunkStrategy,
    });

    res.status(201).json({
      success: true,
      message: "Document ingested successfully",
      data: result,
    });
  } catch (error) {
    console.error("[RAG Controller] Upload error:", error);
    res.status(500).json({
      message: "Failed to ingest document",
      error: error.message,
    });
  }
};

/**
 * List all documents for a user
 */
exports.list = async (req, res) => {
  try {
    const documents = await Document.find({ user: req.user._id })
      .select("title filename createdAt chunks metadata")
      .sort({ createdAt: -1 });

    const formattedDocs = documents.map((doc) => ({
      _id: doc._id,
      title: doc.title,
      filename: doc.filename,
      totalChunks: doc.chunks ? doc.chunks.length : 0,
      metadata: doc.metadata || {},
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    }));

    res.json({
      success: true,
      count: formattedDocs.length,
      documents: formattedDocs,
    });
  } catch (error) {
    console.error("[RAG Controller] List error:", error);
    res.status(500).json({
      message: "Failed to fetch documents",
      error: error.message,
    });
  }
};

/**
 * Ask a question about documents using RAG
 */
exports.ask = async (req, res) => {
  try {
    const { docId, query, k = 5 } = req.body;

    if (!query || query.trim().length === 0) {
      return res.status(400).json({ message: "Query is required" });
    }

    console.log(
      `[RAG Controller] Processing question: "${query.substring(0, 50)}..."`,
    );

    const result = await askWithContext({
      userId: req.user._id,
      docId: docId || null,
      query: query.trim(),
      k: Math.min(k, 10), // Limit to max 10 chunks
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("[RAG Controller] Ask error:", error);
    res.status(500).json({
      message: "Failed to process question",
      error: error.message,
    });
  }
};

/**
 * Retrieve relevant chunks for a query (without generating answer)
 */
exports.retrieve = async (req, res) => {
  try {
    const { docId, query, k = 5, threshold = 0.3 } = req.body;

    if (!query || query.trim().length === 0) {
      return res.status(400).json({ message: "Query is required" });
    }

    const results = await retrieve({
      userId: req.user._id,
      docId: docId || null,
      query: query.trim(),
      k: Math.min(k, 10),
      similarityThreshold: threshold,
    });

    res.json({
      success: true,
      count: results.length,
      results: results.map((r) => ({
        id: r.id,
        text: r.text,
        similarity: (r.similarity * 100).toFixed(2) + "%",
        source: r.source,
        chunkIndex: r.chunkIndex,
      })),
    });
  } catch (error) {
    console.error("[RAG Controller] Retrieve error:", error);
    res.status(500).json({
      message: "Failed to retrieve context",
      error: error.message,
    });
  }
};

/**
 * Delete a document
 */
exports.remove = async (req, res) => {
  try {
    const result = await deleteDocument(req.user._id, req.params.id);

    res.json({
      success: true,
      message: "Document deleted successfully",
      data: result,
    });
  } catch (error) {
    console.error("[RAG Controller] Delete error:", error);
    res.status(500).json({
      message: "Failed to delete document",
      error: error.message,
    });
  }
};

/**
 * Get document statistics
 */
exports.getStats = async (req, res) => {
  try {
    const stats = await getDocumentStats(req.user._id, req.params.id);

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error("[RAG Controller] Stats error:", error);
    res.status(500).json({
      message: "Failed to fetch document stats",
      error: error.message,
    });
  }
};

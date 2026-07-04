const mongoose = require("mongoose");

// Chunk schema with embedding support
const chunkSchema = new mongoose.Schema(
  {
    id: { type: String, unique: false },
    text: { type: String, required: true },
    embedding: [Number],
    index: Number,
    metadata: {
      filename: String,
      chunkIndex: Number,
      totalChunks: Number,
      sourceTitle: String,
    },
  },
  { _id: false },
);

// Document schema for RAG storage
const documentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
    },
    title: {
      type: String,
      required: true,
    },
    filename: {
      type: String,
      required: true,
    },
    fileUrl: String,
    mimeType: String,

    // RAG-specific fields
    chunks: [chunkSchema],
    metadata: {
      strategy: {
        type: String,
        enum: ["simple", "recursive", "semantic"],
        default: "recursive",
      },
      totalChunks: Number,
      textLength: Number,
      processedAt: { type: Date, default: Date.now },
    },

    // Tracking
    status: {
      type: String,
      enum: ["processing", "ready", "failed"],
      default: "ready",
    },
    errorMessage: String,
  },
  { timestamps: true },
);

// Index for efficient queries
documentSchema.index({ user: 1, createdAt: -1 });
documentSchema.index({ user: 1, title: "text", filename: "text" });

module.exports = mongoose.model("Document", documentSchema);

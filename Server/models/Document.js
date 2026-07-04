const mongoose = require("mongoose");

const chunkSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    text: { type: String, required: true },
    embedding: { type: [Number], default: [] },
    index: { type: Number, default: 0 },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { _id: false },
);

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
      default: null,
    },
    title: { type: String, required: true },
    filename: { type: String, required: true },
    fileUrl: { type: String, default: "" },
    mimeType: { type: String, default: "application/octet-stream" },
    chunks: [chunkSchema],
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Document", documentSchema);

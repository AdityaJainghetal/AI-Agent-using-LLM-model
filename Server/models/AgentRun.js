const mongoose = require('mongoose');

const stepSchema = new mongoose.Schema(
  {
    step: Number,
    thought: String,
    action: String,
    input: String,
    answer: String,
  },
  { _id: false }
);

const agentRunSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    agentType: {
      type: String,
      required: true,
      enum: ['studyPlanner', 'career', 'interview', 'codingMentor', 'recommender', 'revision'],
      index: true,
    },
    title: { type: String, required: true }, // short preview of the input, shown in history list
    input: { type: String, required: true }, // the raw question/goal/topic/code the student submitted
    answer: { type: String, default: '' },
    transcript: { type: [stepSchema], default: [] },
    status: { type: String, enum: ['ok', 'failed'], default: 'ok' },
  },
  { timestamps: true }
);

agentRunSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('AgentRun', agentRunSchema);
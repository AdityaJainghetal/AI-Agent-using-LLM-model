const mongoose = require('mongoose');

const submissionSchema = new mongoose.Schema(
  {
    assignment: { type: mongoose.Schema.Types.ObjectId, ref: 'Assignment', required: true, index: true },
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    fileUrl: String,
    text: String,
    marks: Number,
    feedback: String,
    aiEvaluation: {
      score: Number,
      feedback: String,
      strengths: [String],
      improvements: [String],
    },
    status: { type: String, enum: ['submitted', 'graded', 'returned'], default: 'submitted' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Submission', submissionSchema);

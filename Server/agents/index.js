const { runAgent } = require('./runner');
const { chat } = require('../ai/openrouter');
const { retrieve } = require('../rag/vectorStore');

const webSearchStub = {
  description: 'Pretend web search; returns a brief synthetic summary',
  run: async (q) => `Search results for "${q}": (offline stub) — top resources include official docs and community tutorials.`,
};

const ragLookup = (userId) => ({
  description: 'Search the user uploaded documents',
  run: async (q) => {
    const hits = await retrieve({ userId, query: q, k: 3 });
    return hits.map((h) => h.text).join('\n---\n') || 'No relevant material found.';
  },
});

exports.studyPlanner = (userId, goal) =>
  runAgent({
    role: 'Study Planner',
    task: `Design a 4-week study plan to achieve: ${goal}. Include weekly milestones, topics, practice tasks.`,
    tools: { search: webSearchStub, materials: ragLookup(userId) },
  });

exports.career = (userId, profile) =>
  runAgent({
    role: 'Career Counselor',
    task: `Given this profile/goal: ${profile}. Suggest a 6-month career roadmap with skills, projects, certifications, target roles.`,
    tools: { search: webSearchStub },
  });

exports.interview = (userId, topic) =>
  runAgent({
    role: 'Interview Coach',
    task: `Prepare a candidate for ${topic} interviews. Produce 8 questions with model answers, 3 follow-ups, and 3 tips.`,
    tools: { search: webSearchStub },
  });

exports.evaluator = async (assignmentBrief, submissionText) => {
  const messages = [
    { role: 'system', content: 'You are a strict but fair grader. Output JSON: {score (0-100), feedback, strengths[], improvements[]}.' },
    { role: 'user', content: `ASSIGNMENT:\n${assignmentBrief}\n\nSUBMISSION:\n${submissionText}` },
  ];
  const raw = await chat(messages, { temperature: 0.2, maxTokens: 700 });
  try {
    return JSON.parse(raw.match(/\{[\s\S]*\}/)[0]);
  } catch {
    return { score: 0, feedback: raw, strengths: [], improvements: [] };
  }
};

exports.codingMentor = (userId, code) =>
  runAgent({
    role: 'Coding Mentor',
    task: `Review this code, find bugs, suggest improvements, provide fixed version with explanation.\n\n${code}`,
    tools: { search: webSearchStub },
  });

exports.recommender = (userId, interests) =>
  runAgent({
    role: 'Learning Recommendation Engine',
    task: `Recommend 5 courses/topics aligned with: ${interests}. Justify each pick.`,
    tools: { materials: ragLookup(userId) },
  });

exports.revision = (userId, topic) =>
  runAgent({
    role: 'Revision Coach',
    task: `Create a focused revision sheet for: ${topic}. Include key concepts, formulas, common mistakes, 5 quick MCQs.`,
    tools: { materials: ragLookup(userId) },
  });

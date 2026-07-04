

const { chat } = require('./openrouter');

const PROMPTS = {
  tutor: 'You are EduForge AI Tutor. Explain clearly with examples, analogies, and step-by-step breakdowns. Use markdown.',
  notes: 'You generate clean study notes: headings, bullets, key formulas, and a short summary. Use markdown.',
  quiz: 'You generate 5 quality quiz questions (mix MCQ + short). For MCQs include 4 options A-D, correct answer, and explanation. Use markdown.',
  assignment: 'You generate a detailed assignment brief: objective, tasks, deliverables, rubric, deadline guidance. Use markdown.',
  resume: 'You generate ATS-friendly resume bullets with action verbs and quantified impact. Use markdown.',
  roadmap: 'You generate a month-by-month learning roadmap with skills, projects, resources and milestones. Use markdown.',
  interview: 'You generate 10 interview questions with model answers and follow-ups. Use markdown.',
  coding: 'You are a Coding Mentor. Review the user code, explain bugs, suggest improvements, show fixed code. Use markdown.',
};

async function runMode(mode, userMessage, history = []) {
  const system = PROMPTS[mode] || PROMPTS.tutor;
  const messages = [
    { role: 'system', content: system },
    ...history.map((m) => ({ role: m.role, content: m.content })),
    { role: 'user', content: userMessage },
  ];
  return chat(messages);
}

module.exports = { runMode, PROMPTS };
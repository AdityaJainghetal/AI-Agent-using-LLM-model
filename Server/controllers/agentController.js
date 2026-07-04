


const agents = require('../agents');
const AgentRun = require('../models/AgentRun');

const TITLE_MAX = 60;
const titleFrom = (text) => String(text || '').trim().slice(0, TITLE_MAX) || 'Untitled';


async function runAndSave({ req, res, agentType, input, callAgent }) {
  let result;
  let status = 'ok';
  try {
    result = await callAgent();
  } catch (error) {
    console.error(`[agent:${agentType}]`, error);
    status = 'failed';
    result = { answer: '', transcript: [] };
  }

  let run;
  try {
    run = await AgentRun.create({
      user: req.user._id,
      agentType,
      title: titleFrom(input),
      input: String(input || ''),
      answer: result.answer || '',
      transcript: result.transcript || [],
      status,
    });
  } catch (saveErr) {
    // Don't let a DB hiccup hide the agent's actual answer from the student.
    console.error(`[agent:${agentType}] failed to save history`, saveErr);
  }

  if (status === 'failed') {
    return res.status(500).json({ message: 'Agent run failed', runId: run?._id });
  }

  res.json({ ...result, runId: run?._id });
}

exports.studyPlanner = (req, res) =>
  runAndSave({
    req,
    res,
    agentType: 'studyPlanner',
    input: req.body.goal,
    callAgent: () => agents.studyPlanner(req.user._id, req.body.goal),
  });

exports.career = (req, res) =>
  runAndSave({
    req,
    res,
    agentType: 'career',
    input: req.body.profile,
    callAgent: () => agents.career(req.user._id, req.body.profile),
  });

exports.interview = (req, res) =>
  runAndSave({
    req,
    res,
    agentType: 'interview',
    input: req.body.topic,
    callAgent: () => agents.interview(req.user._id, req.body.topic),
  });

exports.codingMentor = (req, res) =>
  runAndSave({
    req,
    res,
    agentType: 'codingMentor',
    input: req.body.code,
    callAgent: () => agents.codingMentor(req.user._id, req.body.code),
  });

exports.recommender = (req, res) =>
  runAndSave({
    req,
    res,
    agentType: 'recommender',
    input: req.body.interests,
    callAgent: () => agents.recommender(req.user._id, req.body.interests),
  });

exports.revision = (req, res) =>
  runAndSave({
    req,
    res,
    agentType: 'revision',
    input: req.body.topic,
    callAgent: () => agents.revision(req.user._id, req.body.topic),
  });

// ==================== HISTORY ====================

exports.listRuns = async (req, res) => {
  try {
    const { agentType } = req.query;
    const filter = { user: req.user._id };
    if (agentType) filter.agentType = agentType;

    const runs = await AgentRun.find(filter)
      .sort({ createdAt: -1 })
      .select('agentType title status createdAt');
    res.json(runs);
  } catch (error) {
    console.error('[agent:listRuns]', error);
    res.status(500).json({ message: 'Failed to load agent history' });
  }
};

exports.getRun = async (req, res) => {
  try {
    const run = await AgentRun.findOne({ _id: req.params.id, user: req.user._id });
    if (!run) return res.status(404).json({ message: 'Run not found' });
    res.json(run);
  } catch (error) {
    console.error('[agent:getRun]', error);
    res.status(500).json({ message: 'Failed to load run' });
  }
};

exports.deleteRun = async (req, res) => {
  try {
    await AgentRun.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    res.json({ ok: true });
  } catch (error) {
    console.error('[agent:deleteRun]', error);
    res.status(500).json({ message: 'Failed to delete run' });
  }
};
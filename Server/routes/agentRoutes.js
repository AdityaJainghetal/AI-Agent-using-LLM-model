// // const router = require('express').Router();
// // const c = require('../controllers/agentController');
// // const { protect } = require('../middlewares/auth');

// // router.post('/study-planner', protect, c.studyPlanner);
// // router.post('/career', protect, c.career);
// // router.post('/interview', protect, c.interview);
// // router.post('/coding-mentor', protect, c.codingMentor);
// // router.post('/recommender', protect, c.recommender);
// // router.post('/revision', protect, c.revision);

// // module.exports = router;


// const router = require('express').Router();
// const c = require('../controllers/agentController');
// const { protect } = require('../middlewares/auth');

// router.post('/study-planner', protect, c.studyPlanner);
// router.post('/career', protect, c.career);
// router.post('/interview', protect, c.interview);
// router.post('/coding-mentor', protect, c.codingMentor);
// router.post('/recommender', protect, c.recommender);
// router.post('/revision', protect, c.revision);

// module.exports = router;



const express = require('express');
const router = express.Router();
const agentController = require('../controllers/agentController');
const { protect } = require('../middlewares/auth'); // adjust to your real auth middleware name/path

// ---- existing agent run endpoints ----
router.post('/study-planner', protect, agentController.studyPlanner);
router.post('/career', protect, agentController.career);
router.post('/interview', protect, agentController.interview);
router.post('/coding-mentor', protect, agentController.codingMentor);
router.post('/recommender', protect, agentController.recommender);
router.post('/revision', protect, agentController.revision);

// ---- new: history endpoints ----
router.get('/history', protect, agentController.listRuns);       // GET /api/agents/history?agentType=interview
router.get('/history/:id', protect, agentController.getRun);     // GET /api/agents/history/:id
router.delete('/history/:id', protect, agentController.deleteRun); // DELETE /api/agents/history/:id

module.exports = router;
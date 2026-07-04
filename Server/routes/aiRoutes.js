// const router = require('express').Router();
// const c = require('../controllers/aiController');
// const { protect } = require('../middlewares/auth');

// router.get('/chats', protect, c.listChats);
// router.get('/chats/:id', protect, c.getChat);
// router.delete('/chats/:id', protect, c.deleteChat);
// router.post('/chat', protect, c.send);
// router.post('/generate', protect, c.generate);

// module.exports = router;

const router = require("express").Router();
const c = require("../controllers/aiController");
const { protect } = require("../middlewares/auth");

// Public endpoint for simple chatbot
router.post("/public/chat", c.publicChat);

// Protected endpoints
router.post("/chat", protect, c.send); // ← Important
router.get("/chats", protect, c.listChats);
router.get("/chats/:id", protect, c.getChat);
router.delete("/chats/:id", protect, c.deleteChat);
router.post("/generate", protect, c.generate);

module.exports = router;

const router = require("express").Router();
const c = require("../controllers/ragController");
const { protect } = require("../middlewares/auth");
const { uploadNote } = require("../config/multer");

// Document management
router.post("/upload", protect, uploadNote.single("file"), c.upload);
router.get("/documents", protect, c.list);
router.delete("/documents/:id", protect, c.remove);
router.get("/documents/:id/stats", protect, c.getStats);

// RAG operations
router.post("/ask", protect, c.ask); // Ask question and get answer
router.post("/retrieve", protect, c.retrieve); // Retrieve chunks without answer

module.exports = router;

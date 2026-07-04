const Chat = require("../models/Chat");
const { runMode } = require("../ai/prompts");

const getErrorMessage = (error) => {
  if (error.message.includes("Ollama is not running")) {
    return "Ollama service is not running. Start it with: ollama serve";
  }
  if (error.message.includes("not configured")) {
    return "AI provider not configured. Check your .env file.";
  }
  if (error.message.includes("Unknown AI provider")) {
    return "Invalid AI provider configuration.";
  }
  if (error.message.includes("ECONNREFUSED")) {
    return "Cannot connect to AI service. Please check if it's running.";
  }
  return "AI service failed. Please try again.";
};

// Public endpoint - no auth required
exports.publicChat = async (req, res) => {
  try {
    const { message, mode = "tutor" } = req.body;
    const trimmedMessage = message?.trim();

    if (!trimmedMessage) {
      return res.status(400).json({ message: "Message is required" });
    }

    const reply = await runMode(mode, trimmedMessage);

    if (!reply || !reply.trim()) {
      throw new Error("AI returned empty response");
    }

    res.json({ reply: reply.trim() });
  } catch (error) {
    console.error("=== PUBLIC CHAT ERROR ===", error.message);
    res.status(500).json({
      message: getErrorMessage(error),
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "An error occurred",
    });
  }
};

exports.listChats = async (req, res) => {
  const chats = await Chat.find({ user: req.user._id })
    .sort({ updatedAt: -1 })
    .select("title mode updatedAt");
  res.json(chats);
};

exports.getChat = async (req, res) => {
  const chat = await Chat.findOne({ _id: req.params.id, user: req.user._id });
  if (!chat) return res.status(404).json({ message: "Chat not found" });
  res.json(chat);
};

exports.deleteChat = async (req, res) => {
  await Chat.findOneAndDelete({ _id: req.params.id, user: req.user._id });
  res.json({ ok: true });
};

// ==================== MAIN SEND ====================
exports.send = async (req, res) => {
  try {
    const { chatId, message, mode = "tutor" } = req.body;

    if (!message?.trim()) {
      return res.status(400).json({ message: "Message is required" });
    }

    let chat = chatId
      ? await Chat.findOne({ _id: chatId, user: req.user._id })
      : null;

    if (!chat) {
      chat = await Chat.create({
        user: req.user._id,
        mode,
        title: message.trim().slice(0, 60),
      });
    }

    // Add user message
    chat.messages.push({ role: "user", content: message.trim() });

    // Get AI reply
    const reply = await runMode(mode, message.trim(), chat.messages.slice(-12));

    if (!reply) {
      throw new Error("AI returned empty response");
    }

    // Add assistant message
    chat.messages.push({ role: "assistant", content: reply });
    await chat.save();

    res.json({ chat, reply });
  } catch (error) {
    console.error("=== AI SEND ERROR ===", error);
    res.status(500).json({
      message: "AI service failed. Please try again.",
      error: error.message,
    });
  }
};

exports.generate = async (req, res) => {
  try {
    const { mode, prompt } = req.body;
    const reply = await runMode(mode, prompt);
    res.json({ reply });
  } catch (error) {
    console.error("Generate Error:", error);
    res.status(500).json({ message: "Generation failed" });
  }
};

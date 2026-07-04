import { useEffect, useRef, useState } from "react";
import { FiSend, FiPlus, FiMessageSquare, FiUser } from "react-icons/fi";

const STORAGE_KEY = "rag-chat-messages";
const DEFAULT_WELCOME_MESSAGE = {
  id: 1,
  text: "Hello! I’m your RAG chatbot. Ask me anything and I’ll respond from the backend.",
  isUser: false,
};

function App() {
  const [messages, setMessages] = useState(() => {
    if (typeof window === "undefined") return [DEFAULT_WELCOME_MESSAGE];
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [DEFAULT_WELCOME_MESSAGE];
    } catch (error) {
      console.error("Failed to load saved chat:", error);
      return [DEFAULT_WELCOME_MESSAGE];
    }
  });
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    }
  }, [messages]);

  const sendMessage = async () => {
    const trimmedInput = input.trim();
    if (!trimmedInput || isSending) return;

    const userMessage = { id: Date.now(), text: trimmedInput, isUser: true };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsSending(true);

    try {
      const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";
      const endpoint = `${baseUrl}/api/ai/public/chat`;
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmedInput, mode: "tutor" }),
      });

      if (!res.ok) {
        throw new Error(`API error: ${res.status}`);
      }

      const data = await res.json();
      const botReply =
        data.reply || data.message || "Sorry, I couldn’t process your request.";
      setMessages((prev) => [
        ...prev,
        { id: Date.now() + 1, text: botReply, isUser: false },
      ]);
    } catch (error) {
      console.error("Error fetching assistant response:", error);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          text: "Sorry, I couldn’t reach the backend right now.",
          isUser: false,
        },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey && !isSending) {
      event.preventDefault();
      sendMessage();
    }
  };

  const newChat = () => {
    setMessages([DEFAULT_WELCOME_MESSAGE]);
    setInput("");
    setIsSending(false);
  };

  return (
    <div className="flex h-screen bg-[#0A0A0A] text-white overflow-hidden">
      <div className="w-72 bg-[#171717] border-r border-gray-800 flex flex-col">
        <div className="p-4">
          <button
            onClick={newChat}
            className="w-full flex items-center justify-center gap-3 bg-white/10 hover:bg-white/20 py-3 px-4 rounded-2xl text-sm font-medium transition"
          >
            <FiPlus size={20} />
            New Chat
          </button>
        </div>

        <div className="px-3 flex-1 overflow-y-auto">
          <div className="text-xs text-gray-500 px-4 py-3">Recent</div>
          <div className="space-y-1 px-2">
            {[
              "Ask about your documents",
              "Summarize a topic",
              "Draft a study plan",
            ].map((chat, index) => (
              <div
                key={index}
                className="px-4 py-3 hover:bg-white/10 rounded-2xl cursor-pointer flex items-center gap-3 text-sm"
              >
                <FiMessageSquare />
                {chat}
              </div>
            ))}
          </div>
        </div>

        <div className="p-4 border-t border-gray-800 mt-auto">
          <div className="flex items-center gap-3 px-4 py-3 hover:bg-white/10 rounded-2xl cursor-pointer">
            <div className="w-9 h-9 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
              <FiUser size={20} />
            </div>
            <div>
              <p className="font-medium">You</p>
              <p className="text-xs text-emerald-400">Online</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col">
        <div className="h-16 border-b border-gray-800 flex items-center px-6">
          <div className="flex items-center gap-4">
            <div className="w-9 h-9 bg-emerald-500 rounded-2xl flex items-center justify-center text-xl">
              🚀
            </div>
            <div>
              <h1 className="font-semibold text-lg">RAG Chat</h1>
              <p className="text-xs text-emerald-400">● Ready</p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.isUser ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[75%] px-6 py-4 rounded-3xl ${msg.isUser ? "bg-blue-600 rounded-br-none" : "bg-[#1F1F1F] rounded-bl-none"}`}
              >
                <p className="text-[17px] leading-relaxed whitespace-pre-wrap">
                  {msg.text}
                </p>
              </div>
            </div>
          ))}

          {isSending && (
            <div className="flex justify-start">
              <div className="bg-[#1F1F1F] px-6 py-4 rounded-3xl rounded-bl-none">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div
                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: "150ms" }}
                  ></div>
                  <div
                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: "300ms" }}
                  ></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-6 bg-[#0A0A0A]">
          <div className="max-w-3xl mx-auto">
            <div className="relative">
              <textarea
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={handleKeyDown}
                rows={1}
                disabled={isSending}
                className="w-full bg-[#1F1F1F] border border-gray-700 focus:border-gray-500 rounded-3xl py-6 px-7 pr-24 text-lg resize-y focus:outline-none min-h-[56px] disabled:opacity-70"
                placeholder={isSending ? "Thinking..." : "Message RAG Chat..."}
              />
              <button
                onClick={sendMessage}
                disabled={!input.trim() || isSending}
                className="absolute bottom-4 right-4 bg-white text-black p-3.5 rounded-2xl hover:bg-gray-200 disabled:opacity-40 transition"
              >
                <FiSend size={22} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;

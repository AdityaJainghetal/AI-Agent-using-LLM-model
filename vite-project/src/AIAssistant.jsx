import { useEffect, useState, useRef, useMemo, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  sendMessage,
  listChats,
  setCurrentChat,
} from "../../redux/slices/aiSlice";
import { aiApi, ragApi, agentApi } from "../../services";
import { toast } from "react-toastify";
import Loader from "../../components/Loader.jsx";

// ─── Mode Definitions (unchanged) ─────────────────────────────────────────
const CHAT_MODES = [
  {
    id: "tutor",
    label: "AI Tutor",
    icon: "🎓",
    color: "violet",
    blurb: "Explains concepts step by step",
  },
  {
    id: "notes",
    label: "Notes",
    icon: "📝",
    color: "cyan",
    blurb: "Turns a topic into study notes",
  },
  {
    id: "quiz",
    label: "Quiz",
    icon: "⚡",
    color: "amber",
    blurb: "Drills you with practice questions",
  },
  {
    id: "assignment",
    label: "Assignment",
    icon: "📋",
    color: "emerald",
    blurb: "Drafts assignment briefs",
  },
  {
    id: "resume",
    label: "Resume",
    icon: "📄",
    color: "blue",
    blurb: "Writes ATS-ready resume bullets",
  },
];
const AGENT_MODES = [
  {
    id: "roadmap",
    label: "Career Roadmap",
    icon: "🗺️",
    color: "fuchsia",
    blurb: "Plans a 6-month roadmap",
    endpoint: "career",
    paramKey: "profile",
  },
  {
    id: "interview",
    label: "Interview Coach",
    icon: "🎙️",
    color: "orange",
    blurb: "Runs a mock interview prep",
    endpoint: "interview",
    paramKey: "topic",
  },
  {
    id: "coding",
    label: "Coding Mentor",
    icon: "💻",
    color: "green",
    blurb: "Reviews code, finds bugs",
    endpoint: "codingMentor",
    paramKey: "code",
  },
  {
    id: "planner",
    label: "Study Planner",
    icon: "📅",
    color: "teal",
    blurb: "Builds a 4-week study plan",
    endpoint: "studyPlanner",
    paramKey: "goal",
  },
  {
    id: "revision",
    label: "Revision Coach",
    icon: "🔁",
    color: "rose",
    blurb: "Builds a focused revision sheet",
    endpoint: "revision",
    paramKey: "topic",
  },
];
const ALL_MODES = [...CHAT_MODES, ...AGENT_MODES];

// ─── Color token map ───────────────────────────────────────────────────────
const colorMap = {
  violet: {
    bg: "bg-violet-500/15",
    border: "border-violet-500/30",
    text: "text-violet-400",
    dot: "bg-violet-400",
    pill: "bg-violet-500/20 text-violet-300 border-violet-500/30",
  },
  cyan: {
    bg: "bg-cyan-500/15",
    border: "border-cyan-500/30",
    text: "text-cyan-400",
    dot: "bg-cyan-400",
    pill: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
  },
  amber: {
    bg: "bg-amber-500/15",
    border: "border-amber-500/30",
    text: "text-amber-400",
    dot: "bg-amber-400",
    pill: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  },
  emerald: {
    bg: "bg-emerald-500/15",
    border: "border-emerald-500/30",
    text: "text-emerald-400",
    dot: "bg-emerald-400",
    pill: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  },
  blue: {
    bg: "bg-blue-500/15",
    border: "border-blue-500/30",
    text: "text-blue-400",
    dot: "bg-blue-400",
    pill: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  },
  fuchsia: {
    bg: "bg-fuchsia-500/15",
    border: "border-fuchsia-500/30",
    text: "text-fuchsia-400",
    dot: "bg-fuchsia-400",
    pill: "bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/30",
  },
  orange: {
    bg: "bg-orange-500/15",
    border: "border-orange-500/30",
    text: "text-orange-400",
    dot: "bg-orange-400",
    pill: "bg-orange-500/20 text-orange-300 border-orange-500/30",
  },
  green: {
    bg: "bg-green-500/15",
    border: "border-green-500/30",
    text: "text-green-400",
    dot: "bg-green-400",
    pill: "bg-green-500/20 text-green-300 border-green-500/30",
  },
  teal: {
    bg: "bg-teal-500/15",
    border: "border-teal-500/30",
    text: "text-teal-400",
    dot: "bg-teal-400",
    pill: "bg-teal-500/20 text-teal-300 border-teal-500/30",
  },
  rose: {
    bg: "bg-rose-500/15",
    border: "border-rose-500/30",
    text: "text-rose-400",
    dot: "bg-rose-400",
    pill: "bg-rose-500/20 text-rose-300 border-rose-500/30",
  },
};

// ─── Suggestion chips per mode ─────────────────────────────────────────────
const modeSuggestions = {
  tutor: [
    "Explain backpropagation",
    "What is attention mechanism?",
    "Teach me recursion with examples",
  ],
  notes: [
    "Notes on React hooks",
    "Summarize OS scheduling algorithms",
    "Key concepts in machine learning",
  ],
  quiz: [
    "Quiz me on Python basics",
    "10 questions on data structures",
    "Test me on SQL joins",
  ],
  assignment: [
    "Assignment on REST APIs",
    "Write a brief on sorting algorithms",
    "Project brief for e-commerce app",
  ],
  resume: [
    "Bullet for React developer role",
    "Improve this experience: built a login page",
    "Skills section for ML engineer",
  ],
  roadmap: [
    "I want to become an ML Engineer in 6 months",
    "Frontend developer roadmap for fresher",
    "Data scientist career plan",
  ],
  interview: [
    "Prep me for Google SWE interview",
    "Top system design questions",
    "Behavioral questions for PM role",
  ],
  coding: [
    "Review my bubble sort code",
    "Find bugs in this Python function",
    "Optimize this SQL query",
  ],
  planner: [
    "Study plan for GATE exam in 8 weeks",
    "4-week plan to learn Next.js",
    "DSA revision plan for placement",
  ],
  revision: [
    "Revision sheet for DBMS",
    "Key formulas for ML algorithms",
    "Quick revision of OS concepts",
  ],
};

// ─── Markdown-like renderer (bold, code, bullets) ─────────────────────────
function MessageContent({ content }) {
  const lines = content.split("\n");
  return (
    <div className="space-y-1.5">
      {lines.map((line, i) => {
        if (line.startsWith("```")) return null;
        if (line.startsWith("### "))
          return (
            <p key={i} className="font-semibold text-white/90 text-[14px] mt-2">
              {line.slice(4)}
            </p>
          );
        if (line.startsWith("## "))
          return (
            <p key={i} className="font-bold text-white text-[15px] mt-3">
              {line.slice(3)}
            </p>
          );
        if (line.startsWith("# "))
          return (
            <p key={i} className="font-bold text-white text-[16px] mt-3">
              {line.slice(2)}
            </p>
          );
        if (line.startsWith("- ") || line.startsWith("* ")) {
          return (
            <div key={i} className="flex gap-2 items-start">
              <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-violet-400 shrink-0" />
              <span className="text-[13px] leading-relaxed">
                {renderInline(line.slice(2))}
              </span>
            </div>
          );
        }
        if (/^\d+\. /.test(line)) {
          const num = line.match(/^(\d+)\. /)[1];
          return (
            <div key={i} className="flex gap-2.5 items-start">
              <span className="mt-0.5 text-[11px] font-bold text-violet-400 shrink-0 w-4">
                {num}.
              </span>
              <span className="text-[13px] leading-relaxed">
                {renderInline(line.replace(/^\d+\. /, ""))}
              </span>
            </div>
          );
        }
        if (line.startsWith("    ") || line.startsWith("\t")) {
          return (
            <code
              key={i}
              className="block bg-white/5 rounded-lg px-3 py-1 font-mono text-[12px] text-green-300"
            >
              {line.trim()}
            </code>
          );
        }
        if (line.trim() === "") return <div key={i} className="h-1" />;
        return (
          <p key={i} className="text-[13px] leading-relaxed">
            {renderInline(line)}
          </p>
        );
      })}
    </div>
  );
}

function renderInline(text) {
  const parts = text.split(/(`[^`]+`|\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("`") && part.endsWith("`"))
      return (
        <code
          key={i}
          className="bg-white/10 px-1.5 py-0.5 rounded font-mono text-[12px] text-cyan-300"
        >
          {part.slice(1, -1)}
        </code>
      );
    if (part.startsWith("**") && part.endsWith("**"))
      return (
        <strong key={i} className="font-semibold text-white">
          {part.slice(2, -2)}
        </strong>
      );
    return part;
  });
}

// ─── MAIN COMPONENT ────────────────────────────────────────────────────────
export default function AIAssistant() {
  const dispatch = useDispatch();
  const { chats, currentChat, loading } = useSelector((s) => s.ai);

  const [mode, setMode] = useState("tutor");
  const [text, setText] = useState("");
  const [tab, setTab] = useState("chat");
  const [agentRunning, setAgentRunning] = useState(false);
  const [agentTrail, setAgentTrail] = useState(null);
  const [activeRunId, setActiveRunId] = useState(null);
  const [agentRuns, setAgentRuns] = useState([]);
  const [agentRunsLoading, setAgentRunsLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [historyOpen, setHistoryOpen] = useState(false);

  // RAG state
  const [docs, setDocs] = useState([]);
  const [docId, setDocId] = useState("");
  const [ragQ, setRagQ] = useState("");
  const [ragAns, setRagAns] = useState(null);
  const [ragLoading, setRagLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);
  const activeMode = useMemo(
    () => ALL_MODES.find((m) => m.id === mode),
    [mode],
  );
  const isAgentMode = AGENT_MODES.some((m) => m.id === mode);
  const colors = colorMap[activeMode?.color] || colorMap.violet;
  const suggestions = modeSuggestions[mode] || [];

  useEffect(() => {
    dispatch(listChats());
    refreshDocs();
    refreshAgentRuns();
  }, [dispatch]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [currentChat?.messages, agentTrail]);

  useEffect(() => {
    inputRef.current?.focus();
  }, [mode]);

  const refreshDocs = () =>
    ragApi
      .documents()
      .then((r) => setDocs(r.data || []))
      .catch(() => {});
  const refreshAgentRuns = () => {
    setAgentRunsLoading(true);
    agentApi
      .listRuns()
      .then((r) => setAgentRuns(r.data || []))
      .catch(() => {})
      .finally(() => setAgentRunsLoading(false));
  };

  const send = async () => {
    if (!text.trim() || loading || agentRunning) return;
    const messageText = text.trim();
    setText("");
    if (isAgentMode) {
      runAgent(messageText);
      return;
    }
    try {
      await dispatch(
        sendMessage({ chatId: currentChat?._id, message: messageText, mode }),
      ).unwrap();
    } catch {
      toast.error("Failed to send message");
    }
  };

  const runAgent = async (input) => {
    setAgentRunning(true);
    setAgentTrail({ steps: [], answer: null });
    setActiveRunId(null);
    try {
      const fn = agentApi[activeMode.endpoint];
      const r = await fn({ [activeMode.paramKey]: input });
      const { transcript = [], answer, runId } = r.data || {};
      setAgentTrail({ steps: transcript, answer });
      setActiveRunId(runId || null);
      refreshAgentRuns();
    } catch {
      toast.error("Agent run failed");
      setAgentTrail(null);
    } finally {
      setAgentRunning(false);
    }
  };

  const openChat = async (id) => {
    try {
      const r = await aiApi.getChat(id);
      dispatch(setCurrentChat(r.data));
      setAgentTrail(null);
      setActiveRunId(null);
      if (r.data?.mode) setMode(r.data.mode);
      setHistoryOpen(false);
    } catch {
      toast.error("Failed to load history");
    }
  };

  const openAgentRun = async (run) => {
    try {
      const r = await agentApi.getRun(run._id);
      const data = r.data;
      const modeInfo = AGENT_MODES.find((m) => m.endpoint === data.agentType);
      if (modeInfo) setMode(modeInfo.id);
      setAgentTrail({ steps: data.transcript || [], answer: data.answer });
      setActiveRunId(data._id);
      dispatch(setCurrentChat(null));
      setHistoryOpen(false);
    } catch {
      toast.error("Failed to load this run");
    }
  };

  const newThread = () => {
    dispatch(setCurrentChat(null));
    setAgentTrail(null);
    setActiveRunId(null);
    setText("");
    inputRef.current?.focus();
  };

  const handleUpload = async (file) => {
    if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    fd.append("title", file.name);
    try {
      await ragApi.upload(fd);
      toast.success(`"${file.name}" uploaded successfully`);
      refreshDocs();
    } catch {
      toast.error("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const askRag = async () => {
    if (!ragQ.trim() || ragLoading) return;
    setRagAns(null);
    setRagLoading(true);
    try {
      const r = await ragApi.ask({
        docId: docId || undefined,
        query: ragQ.trim(),
      });
      setRagAns(r.data);
    } catch {
      toast.error("Failed to get answer");
    } finally {
      setRagLoading(false);
    }
  };

  const hasMessages = !isAgentMode && currentChat?.messages?.length > 0;
  const hasAgentOutput = isAgentMode && agentTrail;
  const isEmpty = !hasMessages && !hasAgentOutput && !loading && !agentRunning;

  return (
    <div className="flex h-screen w-full bg-[#080810] text-white overflow-hidden font-sans">
      {/* ── Fixed aurora bg ── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/3 w-[500px] h-[400px] bg-violet-600/8 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[300px] bg-cyan-500/6 rounded-full blur-[100px]" />
      </div>

      {/* ══════════════════════════════════════════════
          SIDEBAR
      ══════════════════════════════════════════════ */}
      <aside
        className={`relative z-20 flex flex-col h-full border-r border-white/[0.07] bg-[#0c0c18]/95 backdrop-blur-xl transition-all duration-300 shrink-0 ${sidebarOpen ? "w-[260px]" : "w-[64px]"}`}
      >
        {/* Logo row */}
        <div className="flex items-center gap-3 px-4 py-4 border-b border-white/[0.06]">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-600 flex items-center justify-center text-sm font-bold shrink-0">
            E
          </div>
          {sidebarOpen && (
            <span className="font-semibold text-[15px] text-white/90 truncate">
              EduForge AI
            </span>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="ml-auto w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors shrink-0"
          >
            <svg
              className="w-3.5 h-3.5 text-white/50"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              {sidebarOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 19l-7-7 7-7"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 5l7 7-7 7"
                />
              )}
            </svg>
          </button>
        </div>

        {/* New chat button */}
        <div className="px-3 pt-3 pb-2">
          <button
            onClick={newThread}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-violet-600/20 border border-violet-500/30 hover:bg-violet-600/30 transition-all text-violet-300 text-[13px] font-medium"
          >
            <svg
              className="w-4 h-4 shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 4v16m8-8H4"
              />
            </svg>
            {sidebarOpen && <span>New conversation</span>}
          </button>
        </div>

        {/* Modes list */}
        <div className="flex-1 overflow-y-auto px-2 py-2 space-y-4 scrollbar-none">
          <ModeSection
            label="Chat Assistants"
            modes={CHAT_MODES}
            currentMode={mode}
            onSelect={(id) => {
              setMode(id);
              newThread();
            }}
            collapsed={!sidebarOpen}
          />
          <ModeSection
            label="AI Agents"
            modes={AGENT_MODES}
            currentMode={mode}
            onSelect={(id) => {
              setMode(id);
              newThread();
            }}
            collapsed={!sidebarOpen}
            badge="AGENT"
          />
        </div>

        {/* Bottom: history toggle + docs tab */}
        <div className="border-t border-white/[0.06] p-2 space-y-1">
          <SidebarIconBtn
            icon={
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            }
            label="History"
            collapsed={!sidebarOpen}
            active={historyOpen}
            onClick={() => setHistoryOpen(!historyOpen)}
          />
          <SidebarIconBtn
            icon={
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414A1 1 0 0119 9.414V19a2 2 0 01-2 2z"
                />
              </svg>
            }
            label="My Documents"
            collapsed={!sidebarOpen}
            active={tab === "rag"}
            onClick={() => setTab(tab === "rag" ? "chat" : "rag")}
          />
        </div>
      </aside>

      {/* ══════════════════════════════════════════════
          HISTORY PANEL (overlay)
      ══════════════════════════════════════════════ */}
      {historyOpen && (
        <div
          className="absolute left-[64px] top-0 h-full w-72 z-30 bg-[#0e0e1c]/98 backdrop-blur-xl border-r border-white/[0.07] flex flex-col shadow-2xl"
          style={{ left: sidebarOpen ? "260px" : "64px" }}
        >
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
            <span className="font-semibold text-[14px] text-white/80">
              History
            </span>
            <button
              onClick={() => setHistoryOpen(false)}
              className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
            >
              <svg
                className="w-3.5 h-3.5 text-white/50"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-5">
            {/* Chat history */}
            {chats?.length > 0 && (
              <div>
                <p className="px-2 pb-2 text-[10px] font-bold uppercase tracking-widest text-white/25">
                  Chats
                </p>
                <div className="space-y-0.5">
                  {chats.map((c) => (
                    <button
                      key={c._id}
                      onClick={() => openChat(c._id)}
                      className={`w-full text-left px-3 py-2.5 rounded-xl transition-all text-[13px] ${currentChat?._id === c._id ? "bg-violet-600/20 text-violet-300" : "text-white/55 hover:bg-white/5 hover:text-white/80"}`}
                    >
                      <div className="font-medium truncate">
                        {c.title ||
                          `${ALL_MODES.find((m) => m.id === c.mode)?.label || "Chat"}`}
                      </div>
                      <div className="text-[11px] text-white/25 mt-0.5">
                        {c.messages?.length || 0} messages
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Agent run history */}
            {agentRuns?.length > 0 && (
              <div>
                <p className="px-2 pb-2 text-[10px] font-bold uppercase tracking-widest text-white/25">
                  Agent Runs
                </p>
                {agentRunsLoading ? (
                  <div className="px-3 py-4 text-[12px] text-white/30 flex items-center gap-2">
                    <svg
                      className="w-3.5 h-3.5 animate-spin"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                      />
                    </svg>
                    Loading runs…
                  </div>
                ) : (
                  <div className="space-y-0.5">
                    {agentRuns.map((r) => {
                      const modeInfo = AGENT_MODES.find(
                        (m) => m.endpoint === r.agentType,
                      );
                      return (
                        <button
                          key={r._id}
                          onClick={() => openAgentRun(r)}
                          className={`w-full text-left px-3 py-2.5 rounded-xl transition-all text-[13px] ${activeRunId === r._id ? "bg-fuchsia-600/20 text-fuchsia-300" : "text-white/55 hover:bg-white/5 hover:text-white/80"}`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-base">
                              {modeInfo?.icon || "🤖"}
                            </span>
                            <span className="font-medium truncate">
                              {modeInfo?.label || r.agentType}
                            </span>
                          </div>
                          <div className="text-[11px] text-white/25 mt-0.5 ml-6">
                            {r.transcript?.length || 0} steps
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {!chats?.length && !agentRuns?.length && (
              <div className="px-3 py-12 text-center">
                <div className="text-4xl mb-3 opacity-20">🕐</div>
                <p className="text-[12px] text-white/30">
                  No history yet. Start a conversation.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════
          MAIN CONTENT
      ══════════════════════════════════════════════ */}
      <main className="relative flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {tab === "chat" && (
          <>
            {/* ── Header ── */}
            <header className="relative z-10 flex items-center justify-between px-6 py-3.5 border-b border-white/[0.06] bg-[#080810]/80 backdrop-blur-xl">
              <div className="flex items-center gap-3">
                <div
                  className={`w-9 h-9 rounded-xl ${colors.bg} border ${colors.border} flex items-center justify-center text-lg`}
                >
                  {activeMode?.icon}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-[15px] font-semibold text-white">
                      {activeMode?.label}
                    </h2>
                    {isAgentMode && (
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${colors.pill}`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${colors.dot} animate-pulse`}
                        />{" "}
                        AGENT
                      </span>
                    )}
                  </div>
                  <p className="text-[12px] text-white/40">
                    {activeMode?.blurb}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {(hasMessages || hasAgentOutput) && (
                  <button
                    onClick={newThread}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[12px] text-white/50 border border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.07] hover:text-white/80 transition-all"
                  >
                    <svg
                      className="w-3.5 h-3.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 4v16m8-8H4"
                      />
                    </svg>
                    New
                  </button>
                )}
                <button
                  onClick={() => setHistoryOpen(!historyOpen)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-[12px] border transition-all ${historyOpen ? "bg-violet-600/20 border-violet-500/30 text-violet-300" : "text-white/50 border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.07] hover:text-white/80"}`}
                >
                  <svg
                    className="w-3.5 h-3.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  History
                </button>
              </div>
            </header>

            {/* ── Messages ── */}
            <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4 scroll-smooth">
              <div className="max-w-3xl mx-auto w-full space-y-5">
                {/* Empty state */}
                {isEmpty && (
                  <EmptyState
                    mode={activeMode}
                    colors={colors}
                    suggestions={suggestions}
                    onSuggest={(s) => {
                      setText(s);
                      inputRef.current?.focus();
                    }}
                    isAgent={isAgentMode}
                  />
                )}

                {/* Chat messages */}
                {!isAgentMode &&
                  currentChat?.messages?.map((m, i) => (
                    <ChatMessage
                      key={i}
                      message={m}
                      modeName={activeMode?.label}
                      colors={colors}
                    />
                  ))}

                {/* Chat loading */}
                {!isAgentMode && loading && (
                  <div className="flex gap-3 items-start">
                    <div
                      className={`w-8 h-8 rounded-xl ${colors.bg} border ${colors.border} flex items-center justify-center text-sm shrink-0`}
                    >
                      {activeMode?.icon}
                    </div>
                    <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl rounded-tl-sm px-4 py-3">
                      <ThinkingDots />
                    </div>
                  </div>
                )}

                {/* Agent output */}
                {isAgentMode && hasAgentOutput && (
                  <AgentTrail
                    trail={agentTrail}
                    running={agentRunning}
                    mode={activeMode}
                    colors={colors}
                  />
                )}

                {/* Agent running but no steps yet */}
                {isAgentMode && agentRunning && !agentTrail?.steps?.length && (
                  <div className="flex gap-3 items-start">
                    <div
                      className={`w-8 h-8 rounded-xl ${colors.bg} border ${colors.border} flex items-center justify-center text-sm shrink-0`}
                    >
                      {activeMode?.icon}
                    </div>
                    <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl rounded-tl-sm px-4 py-3">
                      <ThinkingDots
                        label={`${activeMode?.label} is planning...`}
                      />
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* ── Input Area ── */}
            <div className="relative z-10 border-t border-white/[0.06] bg-[#080810]/90 backdrop-blur-xl px-4 py-4">
              <div className="max-w-3xl mx-auto">
                <div
                  className={`relative flex items-end gap-2 rounded-2xl border ${colors.border} bg-white/[0.04] focus-within:bg-white/[0.06] transition-all duration-200 px-4 py-3`}
                >
                  <textarea
                    ref={inputRef}
                    rows={1}
                    className="flex-1 bg-transparent text-[14px] text-white placeholder-white/25 outline-none resize-none max-h-36 leading-relaxed"
                    placeholder={
                      isAgentMode
                        ? `Tell ${activeMode?.label} your goal...`
                        : `Message ${activeMode?.label}...`
                    }
                    value={text}
                    onChange={(e) => {
                      setText(e.target.value);
                      e.target.style.height = "auto";
                      e.target.style.height =
                        Math.min(e.target.scrollHeight, 144) + "px";
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        send();
                      }
                    }}
                    disabled={loading || agentRunning}
                  />
                  <button
                    onClick={send}
                    disabled={loading || agentRunning || !text.trim()}
                    className={`shrink-0 w-9 h-9 rounded-xl flex items-center justify-center transition-all active:scale-95 ${text.trim() && !loading && !agentRunning ? "bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white hover:from-violet-500 hover:to-fuchsia-500 shadow-lg shadow-violet-500/20" : "bg-white/5 text-white/20 cursor-not-allowed"}`}
                  >
                    {agentRunning || loading ? (
                      <svg
                        className="w-4 h-4 animate-spin"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                        />
                      </svg>
                    ) : (
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2.5}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5"
                        />
                      </svg>
                    )}
                  </button>
                </div>
                <p className="text-[11px] text-white/20 mt-2 text-center">
                  Enter to send · Shift+Enter for new line
                </p>
              </div>
            </div>
          </>
        )}

        {/* ══════════════════════════════════════════════
            RAG / DOCUMENTS TAB
        ══════════════════════════════════════════════ */}
        {tab === "rag" && (
          <RagPanel
            docs={docs}
            docId={docId}
            setDocId={setDocId}
            ragQ={ragQ}
            setRagQ={setRagQ}
            ragAns={ragAns}
            ragLoading={ragLoading}
            uploading={uploading}
            dragOver={dragOver}
            setDragOver={setDragOver}
            fileInputRef={fileInputRef}
            onUpload={handleUpload}
            onAsk={askRag}
            onClose={() => setTab("chat")}
          />
        )}
      </main>

      {/* Globally injected styles */}
      <style>{`
        .scrollbar-none { scrollbar-width: none; }
        .scrollbar-none::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
}

// ─── Mode Section ──────────────────────────────────────────────────────────
function ModeSection({
  label,
  modes,
  currentMode,
  onSelect,
  collapsed,
  badge,
}) {
  return (
    <div>
      {!collapsed && (
        <div className="flex items-center gap-2 px-3 pb-2">
          <span className="text-[10px] font-bold uppercase tracking-widest text-white/25">
            {label}
          </span>
          {badge && (
            <span className="text-[9px] font-bold text-fuchsia-400 bg-fuchsia-500/15 border border-fuchsia-500/25 px-1.5 py-0.5 rounded-full">
              {badge}
            </span>
          )}
        </div>
      )}
      <div className="space-y-0.5">
        {modes.map((m) => {
          const c = colorMap[m.color] || colorMap.violet;
          const active = currentMode === m.id;
          return (
            <button
              key={m.id}
              onClick={() => onSelect(m.id)}
              className={`w-full flex items-center gap-3 rounded-xl transition-all duration-150 ${collapsed ? "justify-center px-0 py-2.5" : "px-3 py-2.5 text-left"} ${active ? `${c.bg} border ${c.border}` : "hover:bg-white/[0.05] border border-transparent"}`}
              title={collapsed ? m.label : undefined}
            >
              <span className="text-lg shrink-0">{m.icon}</span>
              {!collapsed && (
                <div className="min-w-0 flex-1">
                  <div
                    className={`text-[13px] font-medium truncate ${active ? c.text : "text-white/70"}`}
                  >
                    {m.label}
                  </div>
                  <div className="text-[11px] text-white/25 truncate">
                    {m.blurb}
                  </div>
                </div>
              )}
              {!collapsed && active && (
                <span
                  className={`w-1.5 h-1.5 rounded-full ${c.dot} shrink-0`}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Sidebar icon button ───────────────────────────────────────────────────
function SidebarIconBtn({ icon, label, collapsed, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-2.5 rounded-xl px-3 py-2.5 transition-all text-[13px] ${active ? "bg-white/[0.08] text-white/80" : "text-white/40 hover:bg-white/[0.05] hover:text-white/60"}`}
      title={collapsed ? label : undefined}
    >
      <span className="shrink-0">{icon}</span>
      {!collapsed && <span>{label}</span>}
    </button>
  );
}

// ─── Chat Message ──────────────────────────────────────────────────────────
function ChatMessage({ message: m, modeName, colors }) {
  const isUser = m.role === "user";
  return (
    <div
      className={`flex gap-3 items-start ${isUser ? "flex-row-reverse" : ""}`}
    >
      {/* Avatar */}
      <div
        className={`w-8 h-8 rounded-xl flex items-center justify-center text-[11px] font-bold shrink-0 ${isUser ? "bg-white/10 text-white/60" : `${colors.bg} border ${colors.border}`}`}
      >
        {isUser ? "You" : "🤖"}
      </div>

      {/* Bubble */}
      <div
        className={`max-w-[78%] rounded-2xl px-4 py-3 ${isUser ? "bg-violet-600/25 border border-violet-500/30 rounded-tr-sm text-white/90" : "bg-white/[0.04] border border-white/[0.08] rounded-tl-sm text-white/85"}`}
      >
        {isUser ? (
          <p className="text-[13px] leading-relaxed">{m.content}</p>
        ) : (
          <MessageContent content={m.content} />
        )}
      </div>
    </div>
  );
}

// ─── Thinking Dots ─────────────────────────────────────────────────────────
function ThinkingDots({ label = "Thinking..." }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex gap-1">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-white/30 animate-bounce"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>
      <span className="text-[12px] text-white/30">{label}</span>
    </div>
  );
}

// ─── Empty State ───────────────────────────────────────────────────────────
function EmptyState({ mode, colors, suggestions, onSuggest, isAgent }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div
        className={`w-16 h-16 rounded-2xl ${colors.bg} border ${colors.border} flex items-center justify-center text-3xl mb-5`}
      >
        {mode?.icon}
      </div>
      <h3 className="text-[18px] font-semibold text-white mb-2">
        {mode?.label}
      </h3>
      <p className="text-[13px] text-white/40 max-w-sm mb-8">
        {mode?.blurb}.{" "}
        {isAgent
          ? "Describe your goal and the agent will build a plan."
          : "Ask anything to get started."}
      </p>

      {suggestions.length > 0 && (
        <div className="w-full max-w-md">
          <p className="text-[11px] text-white/25 uppercase tracking-widest mb-3">
            Try asking
          </p>
          <div className="space-y-2">
            {suggestions.map((s) => (
              <button
                key={s}
                onClick={() => onSuggest(s)}
                className={`w-full text-left px-4 py-3 rounded-xl border ${colors.border} ${colors.bg} hover:bg-white/[0.08] transition-all text-[13px] text-white/70 hover:text-white group`}
              >
                <span className="flex items-center gap-2">
                  <span className={`text-[10px] ${colors.text}`}>→</span>
                  {s}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Agent Trail ───────────────────────────────────────────────────────────
function AgentTrail({ trail, running, mode, colors }) {
  const [expanded, setExpanded] = useState(true);
  const { steps, answer } = trail;

  return (
    <div className="space-y-4">
      {/* Thinking steps */}
      <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] overflow-hidden">
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full px-5 py-4 flex items-center gap-3 hover:bg-white/[0.03] transition-colors text-left"
        >
          <span className="text-lg">{mode?.icon}</span>
          <div className="flex-1">
            <span className="text-[14px] font-medium text-white">
              {running
                ? `${mode?.label} is working…`
                : `${mode?.label} — ${steps.length} steps`}
            </span>
            {running && (
              <span className="ml-2 text-[11px] text-white/30">
                building your plan
              </span>
            )}
          </div>
          <svg
            className={`w-4 h-4 text-white/30 transition-transform ${expanded ? "rotate-180" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>

        {expanded && steps.length > 0 && (
          <div className="border-t border-white/[0.06] px-5 py-4">
            <ol className="relative space-y-4 before:absolute before:left-[7px] before:top-2 before:bottom-2 before:w-px before:bg-white/[0.08]">
              {steps.map((s, i) => (
                <li key={i} className="relative flex gap-4 pl-6">
                  <span
                    className={`absolute left-0 top-1 w-3.5 h-3.5 rounded-full border-2 ${i === steps.length - 1 && running ? `${colors.dot} animate-pulse border-transparent` : "border-white/20 bg-[#080810]"} shrink-0`}
                  />
                  <div className="flex-1 space-y-1.5">
                    <p className="text-[13px] text-white/75 leading-relaxed">
                      {s.thought}
                    </p>
                    {s.action && s.action !== "FINAL" && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-white/[0.04] border border-white/[0.08] rounded-full text-[11px] text-white/40">
                        <svg
                          className="w-3 h-3"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                        </svg>
                        {s.action}
                      </span>
                    )}
                  </div>
                </li>
              ))}
              {running && (
                <li className="relative flex gap-4 pl-6">
                  <span
                    className={`absolute left-0 top-1 w-3.5 h-3.5 rounded-full ${colors.dot} animate-pulse shrink-0`}
                  />
                  <ThinkingDots label="Thinking…" />
                </li>
              )}
            </ol>
          </div>
        )}
      </div>

      {/* Final Answer */}
      {answer && (
        <div
          className={`rounded-2xl border ${colors.border} ${colors.bg} overflow-hidden`}
        >
          <div
            className={`px-5 py-3 border-b ${colors.border} flex items-center gap-2`}
          >
            <span className="text-base">{mode?.icon}</span>
            <span
              className={`text-[12px] font-bold uppercase tracking-widest ${colors.text}`}
            >
              Final Answer
            </span>
          </div>
          <div className="px-5 py-5 text-[13px] leading-relaxed text-white/85 whitespace-pre-wrap">
            <MessageContent content={answer} />
          </div>
        </div>
      )}
    </div>
  );
}

// ─── RAG Panel ─────────────────────────────────────────────────────────────
function RagPanel({
  docs,
  docId,
  setDocId,
  ragQ,
  setRagQ,
  ragAns,
  ragLoading,
  uploading,
  dragOver,
  setDragOver,
  fileInputRef,
  onUpload,
  onAsk,
  onClose,
}) {
  return (
    <div className="flex-1 overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b border-white/[0.06] bg-[#080810]/90 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-lg">
            📄
          </div>
          <div>
            <h2 className="text-[15px] font-semibold text-white">
              My Documents
            </h2>
            <p className="text-[12px] text-white/40">
              Upload files · Ask grounded questions
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[12px] text-white/40 border border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.07] hover:text-white/70 transition-all"
        >
          <svg
            className="w-3.5 h-3.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
          Close
        </button>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-8 space-y-8">
        {/* Upload zone */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            const f = e.dataTransfer.files[0];
            if (f) onUpload(f);
          }}
          onClick={() => fileInputRef.current?.click()}
          className={`relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed py-12 cursor-pointer transition-all duration-200 ${dragOver ? "border-cyan-400 bg-cyan-500/10" : "border-white/[0.1] bg-white/[0.02] hover:border-white/[0.2] hover:bg-white/[0.04]"}`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.docx,.txt"
            onChange={(e) => onUpload(e.target.files[0])}
            hidden
          />
          {uploading ? (
            <>
              <svg
                className="w-8 h-8 text-cyan-400 animate-spin mb-3"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              <p className="text-[13px] text-white/50">
                Uploading and indexing…
              </p>
            </>
          ) : (
            <>
              <div className="w-12 h-12 rounded-2xl bg-white/[0.05] border border-white/[0.1] flex items-center justify-center mb-4">
                <svg
                  className="w-6 h-6 text-white/40"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
                  />
                </svg>
              </div>
              <p className="text-[14px] font-medium text-white/70 mb-1">
                Drop a file or click to browse
              </p>
              <p className="text-[12px] text-white/30">
                PDF, DOCX, or TXT · Max 50MB
              </p>
            </>
          )}
        </div>

        {/* Document list */}
        {docs.length > 0 && (
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-white/25 mb-3">
              {docs.length} document{docs.length !== 1 ? "s" : ""} indexed
            </p>
            <div className="space-y-2">
              {docs.map((d) => (
                <button
                  key={d._id}
                  onClick={() => setDocId(docId === d._id ? "" : d._id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all ${docId === d._id ? "bg-cyan-500/10 border-cyan-500/30" : "bg-white/[0.03] border-white/[0.07] hover:bg-white/[0.06] hover:border-white/[0.12]"}`}
                >
                  <div className="w-8 h-8 rounded-lg bg-red-500/15 border border-red-500/20 flex items-center justify-center text-sm shrink-0">
                    {d.title?.endsWith(".pdf")
                      ? "📕"
                      : d.title?.endsWith(".docx")
                        ? "📘"
                        : "📄"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-medium text-white/80 truncate">
                      {d.title}
                    </div>
                    <div className="text-[11px] text-white/30">
                      {d.chunks?.length || 0} chunks indexed
                    </div>
                  </div>
                  {docId === d._id && (
                    <span className="text-[10px] font-bold text-cyan-400 bg-cyan-500/15 border border-cyan-500/25 px-2 py-0.5 rounded-full">
                      Active
                    </span>
                  )}
                </button>
              ))}
            </div>
            {docId && (
              <button
                onClick={() => setDocId("")}
                className="mt-2 text-[12px] text-white/30 hover:text-white/50 transition-colors"
              >
                ← Search all documents
              </button>
            )}
          </div>
        )}

        {/* Ask question */}
        <div className="space-y-3">
          <p className="text-[11px] font-bold uppercase tracking-widest text-white/25">
            Ask a question
          </p>
          <div className="flex gap-2">
            <input
              className="flex-1 bg-white/[0.04] border border-white/[0.1] focus:border-cyan-500/50 focus:bg-white/[0.06] rounded-xl px-4 py-3 text-[13px] text-white placeholder-white/25 outline-none transition-all"
              value={ragQ}
              onChange={(e) => setRagQ(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && onAsk()}
              placeholder={
                docId
                  ? `Ask about "${docs.find((d) => d._id === docId)?.title || "this document"}"…`
                  : "Ask about any of your documents…"
              }
            />
            <button
              onClick={onAsk}
              disabled={ragLoading || !ragQ.trim()}
              className="px-5 py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:from-white/5 disabled:to-white/5 disabled:text-white/20 text-white text-[13px] font-medium transition-all active:scale-95 shrink-0"
            >
              {ragLoading ? (
                <svg
                  className="w-4 h-4 animate-spin"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
              ) : (
                "Ask"
              )}
            </button>
          </div>
        </div>

        {/* RAG Answer */}
        {ragAns && (
          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] overflow-hidden">
            <div className="px-5 py-4 border-b border-white/[0.06]">
              <p className="text-[11px] font-bold uppercase tracking-widest text-white/25">
                Answer
              </p>
            </div>
            <div className="px-5 py-5 text-[13px] leading-relaxed text-white/80 whitespace-pre-wrap">
              <MessageContent content={ragAns.answer} />
            </div>

            {ragAns.sources?.length > 0 && (
              <div className="border-t border-white/[0.06] px-5 py-4 space-y-3">
                <p className="text-[11px] font-bold uppercase tracking-widest text-white/25">
                  Sources · {ragAns.sources.length}
                </p>
                {ragAns.sources.map((s, i) => (
                  <div
                    key={i}
                    className="bg-white/[0.03] border border-white/[0.07] rounded-xl p-4"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] text-white/40 font-medium">
                        {s.doc}
                      </span>
                      <span className="text-[10px] text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 rounded-full">
                        {(s.score ?? 0).toFixed(3)} match
                      </span>
                    </div>
                    <p className="text-[12px] text-white/60 leading-relaxed">
                      {s.text}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

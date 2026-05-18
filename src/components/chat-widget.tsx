"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Loader2, X, MessageSquare, ChevronDown, History, Trash2, Clock, Plus } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface Session {
  id: string;
  title: string;
  last_message: string;
  created_at: string;
  updated_at: string;
}

interface Message {
  role: "ai" | "user";
  content: string;
}

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: "ai", content: "Halo! Saya asisten AI Smart Cemetery. Ada yang bisa saya bantu?" },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const [showHistory, setShowHistory] = useState(false);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, isOpen]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const checkDrawer = () => {
      const drawerOpen = document.body?.dataset.drawerOpen === "true";
      if (drawerOpen && isOpen) setIsOpen(false);
    };
    checkDrawer();
    const interval = setInterval(checkDrawer, 500);
    return () => clearInterval(interval);
  }, [isOpen]);

  const fetchSessions = async () => {
    setLoadingSessions(true);
    try {
      const res = await fetch("/api/chat/sessions", { method: "GET" });
      if (res.ok) {
        const data = await res.json();
        setSessions(Array.isArray(data.sessions) ? data.sessions : []);
      }
    } catch (err) {
      console.error("Failed to fetch sessions:", err);
    } finally {
      setLoadingSessions(false);
    }
  };

  const fetchMessages = async (sessionId: string) => {
    try {
      const res = await fetch(`/api/chat/sessions/${sessionId}/messages`);
      if (res.ok) {
        const data = await res.json();
        const msgs = (Array.isArray(data) ? data : (data.messages || [])).map((m: { role: string; content: string }) => ({
          role: m.role as "ai" | "user",
          content: m.content,
        }));
        setMessages(msgs);
        setCurrentSessionId(sessionId);
      }
    } catch (err) {
      console.error("Failed to fetch messages:", err);
    }
  };

  const handleOpenHistory = () => {
    setShowHistory(true);
    fetchSessions();
  };

  const handleSelectSession = (session: Session) => {
    fetchMessages(session.id);
    setShowHistory(false);
  };

  const handleDeleteSession = async (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation();
    setDeletingId(sessionId);
    try {
      const res = await fetch(`/api/chat/sessions/${sessionId}/delete`, { method: "POST" });
      if (res.ok) {
        setSessions((prev) => prev.filter((s) => s.id !== sessionId));
        if (currentSessionId === sessionId) {
          setCurrentSessionId(null);
          setMessages([{ role: "ai", content: "Halo! Saya asisten AI Smart Cemetery. Ada yang bisa saya bantu?" }]);
        }
      }
    } catch (err) {
      console.error("Failed to delete session:", err);
    } finally {
      setDeletingId(null);
    }
  };

  const handleNewChat = () => {
    setCurrentSessionId(null);
    setMessages([{ role: "ai", content: "Halo! Saya asisten AI Smart Cemetery. Ada yang bisa saya bantu?" }]);
    setShowHistory(false);
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input;
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMsg }]);
    setLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMsg, session_id: currentSessionId }),
      });
      const data = await res.json();
      if (data.error === "RATE_LIMIT_EXCEEDED") {
        setMessages((prev) => [...prev, { role: "ai", content: "Batas penggunaan telah tercapai. Mohon tunggu sebentar sebelum mengirim pesan lagi." }]);
      } else {
        if (data.session_id) {
          setCurrentSessionId(data.session_id);
        }
        setMessages((prev) => [...prev, { role: "ai", content: data.response || "Maaf, saya tidak dapat menjawab saat ini." }]);
      }
    } catch (err) {
      setMessages((prev) => [...prev, { role: "ai", content: "Maaf, terjadi kesalahan koneksi." }]);
    } finally {
      setLoading(false);
    }
  };

  if (typeof window !== "undefined" && document.body?.dataset.drawerOpen === "true") return null;

  return (
    <>
      <button onClick={() => setIsOpen(!isOpen)} className={`fixed ${isMobile ? "bottom-6 right-6 w-14 h-14" : "bottom-8 right-8 w-16 h-16"} bg-primary text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-all z-40 group`}>
        {isOpen ? <X size={isMobile ? 20 : 24} /> : <MessageSquare size={isMobile ? 20 : 24} />}
        {!isOpen && !isMobile && <span className="absolute right-20 bg-white text-slate-900 px-4 py-2 rounded-xl text-xs font-bold shadow-xl border border-slate-100 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">Tanya AI</span>}
      </button>

      {isOpen && (
        <div className={`fixed ${isMobile ? "bottom-20 right-4 w-[calc(100vw-2rem)] h-[70vh] max-w-[400px]" : "bottom-28 right-8 w-[400px] h-[600px]"} bg-white rounded-[2rem] shadow-2xl border border-slate-100 flex flex-col overflow-hidden z-40 animate-in fade-in slide-in-from-bottom-4 duration-300`}>
          <div className={`p-4 ${isMobile ? "py-3" : "p-6"} bg-primary text-white flex items-center justify-between`}>
            <div className="flex items-center gap-3">
              <div className={`${isMobile ? "w-10 h-10" : "w-12 h-12"} bg-white/20 rounded-xl flex items-center justify-center`}>
                <Bot size={isMobile ? 20 : 28} />
              </div>
              <div>
                <h2 className="font-bold text-base leading-none">AI Assistant</h2>
                <p className={`text-[8px] font-bold text-primary-light uppercase tracking-widest ${isMobile ? "mt-0.5" : "mt-1"}`}>Smart Cemetery</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={handleOpenHistory} className="p-2 hover:bg-white/20 rounded-lg transition-colors" title="Riwayat">
                <History size={20} />
              </button>
              <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-white/20 rounded-lg transition-colors"><ChevronDown size={20} /></button>
            </div>
          </div>

          {showHistory ? (
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="p-4 border-b bg-slate-50 flex items-center justify-between">
                <h3 className="font-bold text-slate-900">Riwayat Chat</h3>
                <button onClick={handleNewChat} className="p-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors" title="Chat Baru">
                  <Plus size={16} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto">
                {loadingSessions ? (
                  <div className="flex items-center justify-center h-32">
                    <Loader2 size={24} className="animate-spin text-primary" />
                  </div>
                ) : sessions.length > 0 ? (
                  <div className="divide-y divide-slate-100">
                    {sessions.map((session) => (
                      <div
                        key={session.id}
                        onClick={() => handleSelectSession(session)}
                        className={`p-4 cursor-pointer hover:bg-slate-50 transition-colors border-b border-slate-50 ${currentSessionId === session.id ? "bg-primary/5" : ""}`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-slate-900 text-sm truncate">{session.title || "Percakapan baru"}</p>
                            <p className="text-xs text-slate-500 mt-1 line-clamp-2">{session.last_message}</p>
                            <p className="text-[10px] text-slate-400 mt-2 flex items-center gap-1">
                              <Clock size={10} />
                              {new Date(session.updated_at).toLocaleDateString("id-ID", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                            </p>
                          </div>
                          <button
                            onClick={(e) => handleDeleteSession(e, session.id)}
                            disabled={deletingId === session.id}
                            className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Hapus"
                          >
                            {deletingId === session.id ? (
                              <Loader2 size={14} className="animate-spin" />
                            ) : (
                              <Trash2 size={14} />
                            )}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-32 text-slate-400">
                    <History size={32} className="mb-2 opacity-50" />
                    <p className="text-sm">Belum ada riwayat chat</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <>
              <div ref={scrollRef} className={`flex-1 ${isMobile ? "p-4" : "p-6"} overflow-y-auto space-y-4 bg-neutral/30`}>
                {messages.map((m, i) => (
                  <div key={i} className={`flex gap-2 ${m.role === "user" ? "flex-row-reverse" : ""}`}>
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${m.role === "ai" ? "bg-primary/10 text-primary" : "bg-slate-200 text-slate-600"}`}>
                      {m.role === "ai" ? <Bot size={14} /> : <User size={14} />}
                    </div>
                    <div className={`max-w-[85%] p-3 rounded-2xl shadow-sm text-sm leading-relaxed ${m.role === "ai" ? "bg-white text-slate-800 rounded-tl-none border border-slate-50" : "bg-primary text-white rounded-tr-none"}`}>
                      {m.role === "ai" && m.content ? (
                        <div className="prose prose-sm prose-slate max-w-none leading-relaxed space-y-2
                           prose-headings:text-base prose-headings:font-bold prose-headings:mb-2
                           prose-p:mb-2 prose-p:leading-relaxed
                           prose-ul:my-2 prose-ol:my-2 prose-li:my-1 prose-li:leading-relaxed
                           prose-ul:space-y-1 prose-ol:space-y-1
                           prose-code:text-primary prose-code:bg-primary/10 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-xs
                           prose-pre:bg-slate-100 prose-pre:p-3 prose-pre:rounded-lg prose-pre:my-2
                           prose-strong:text-primary prose-strong:font-semibold
                           [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {m.content}
                          </ReactMarkdown>
                        </div>
                      ) : (
                        m.content || ""
                      )}
                    </div>
                  </div>
                ))}
                {loading && (
                  <div className="flex gap-2">
                    <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center"><Bot size={14} /></div>
                    <div className="bg-white p-3 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-2 border border-slate-50">
                      <Loader2 size={14} className="animate-spin text-primary" />
                      <p className="text-xs text-slate-400 font-bold uppercase tracking-wider italic">Berpikir...</p>
                    </div>
                  </div>
                )}
              </div>

              <div className={`${isMobile ? "p-3" : "p-6"} bg-white border-t border-slate-100`}>
                <div className={`flex gap-1 ${isMobile ? "p-1" : "p-1 bg-neutral rounded-2xl border border-slate-100"} focus-within:border-primary focus-within:ring-1 focus-within:ring-primary transition-all`}>
                  <input type="text" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleSend()} placeholder="Tanyakan..." className={`flex-1 ${isMobile ? "px-3 py-2 text-sm" : "px-4 py-2.5 text-sm"} bg-transparent outline-none text-slate-800`} />
                  <button onClick={handleSend} disabled={!input.trim() || loading} className={`${isMobile ? "p-2" : "p-2.5"} bg-primary text-white rounded-xl hover:bg-primary-dark transition-all disabled:opacity-50`}><Send size={16} /></button>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}
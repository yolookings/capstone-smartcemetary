"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Loader2, Phone, MessageCircle, Clock, Trash2, Plus, History } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const WHATSAPP_NUMBER = "62881081201102";

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

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "ai",
      content:
        "Halo! Saya asisten AI Smart Cemetery. Ada yang bisa saya bantu terkait prosedur atau regulasi pemakaman?",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const [sessions, setSessions] = useState<Session[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
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
    fetchSessions();
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

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
        const session = sessions.find((s) => s.id === sessionId);
        if (session) {
          setSelectedSession(session);
        }
      }
    } catch (err) {
      console.error("Failed to fetch messages:", err);
    }
  };

  const handleSelectSession = (session: Session) => {
    setSelectedSession(session);
    fetchMessages(session.id);
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
          setSelectedSession(null);
          setMessages([{
            role: "ai",
            content: "Halo! Saya asisten AI Smart Cemetery. Ada yang bisa saya bantu terkait prosedur atau regulasi pemakaman?",
          }]);
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
    setSelectedSession(null);
    setMessages([{
      role: "ai",
      content: "Halo! Saya asisten AI Smart Cemetery. Ada yang bisa saya bantu terkait prosedur atau regulasi pemakaman?",
    }]);
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
        setMessages((prev) => [
          ...prev,
          { role: "ai", content: "Batas penggunaan telah tercapai. Mohon tunggu sebentar sebelum mengirim pesan lagi." },
        ]);
      } else {
        if (data.session_id) {
          setCurrentSessionId(data.session_id);
          const session = sessions.find((s) => s.id === data.session_id);
          if (!session && data.session_id) {
            setSessions((prev) => [{
              id: data.session_id,
              title: userMsg.substring(0, 50),
              last_message: userMsg,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            }, ...prev]);
          }
        }
        setMessages((prev) => [...prev, { role: "ai", content: data.response || "Maaf, saya tidak dapat menjawab saat ini." }]);
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: "ai", content: "Maaf, terjadi kesalahan koneksi." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const openWhatsApp = () => {
    const text = "Halo, saya butuh bantuan terkait Smart Cemetery";
    window.open(
      `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`,
      "_blank",
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Hubungi Kami</h1>
          <p className="text-slate-500 text-sm">
            Chat dengan AI atau hubungi customer service
          </p>
        </div>
        <button
          onClick={openWhatsApp}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
        >
          <Phone size={18} />
          WhatsApp
        </button>
      </div>

      <div className="flex gap-6 h-[calc(100vh-220px)]">
        <div className="w-80 flex-shrink-0 bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col">
          <div className="p-4 border-b flex items-center justify-between">
            <div className="flex items-center gap-2">
              <History size={18} className="text-emerald-600" />
              <h2 className="font-bold text-slate-900">Riwayat Chat</h2>
            </div>
            <button
              onClick={handleNewChat}
              className="p-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
              title="Chat Baru"
            >
              <Plus size={16} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {loadingSessions ? (
              <div className="flex items-center justify-center h-32">
                <Loader2 size={24} className="animate-spin text-emerald-600" />
              </div>
            ) : sessions.length > 0 ? (
              sessions.map((session) => (
                <div
                  key={session.id}
                  onClick={() => handleSelectSession(session)}
                  className={`p-4 cursor-pointer hover:bg-slate-50 transition-colors border-b border-slate-100 ${
                    selectedSession?.id === session.id ? "bg-emerald-50 border-l-4 border-emerald-600" : ""
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-900 text-sm truncate">
                        {session.title || "Percakapan baru"}
                      </p>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                        {session.last_message}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-2 flex items-center gap-1">
                        <Clock size={10} />
                        {new Date(session.updated_at).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
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
              ))
            ) : (
              <div className="flex flex-col items-center justify-center h-32 text-slate-400 p-4">
                <History size={32} className="mb-2 opacity-50" />
                <p className="text-sm text-center">Belum ada riwayat chat</p>
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col">
          <div className="p-4 border-b bg-emerald-700 text-white flex items-center gap-4">
            <div className="p-2 bg-emerald-600 rounded-lg">
              <Bot size={24} />
            </div>
            <div>
              <h2 className="font-bold text-lg leading-none">AI Assistant</h2>
              <p className="text-emerald-200 text-xs mt-1">
                Smart Cemetery RAG Agent
              </p>
            </div>
          </div>

          <div
            ref={scrollRef}
            className="flex-1 p-6 overflow-y-auto space-y-6 bg-slate-50/50"
          >
            {messages.map((m, i) => (
              <div
                key={i}
                className={`flex gap-4 ${m.role === "user" ? "flex-row-reverse" : ""}`}
              >
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    m.role === "ai"
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-slate-200 text-slate-600"
                  }`}
                >
                  {m.role === "ai" ? <Bot size={20} /> : <User size={20} />}
                </div>
                <div
                  className={`max-w-[80%] p-4 rounded-2xl shadow-sm text-sm leading-relaxed ${
                    m.role === "ai"
                      ? "bg-white text-slate-800 rounded-tl-none"
                      : "bg-emerald-600 text-white rounded-tr-none"
                  }`}
                >
                  {m.role === "ai" && m.content ? (
<div className="prose prose-sm prose-slate max-w-none leading-relaxed space-y-2
                           prose-headings:text-base prose-headings:font-bold prose-headings:mb-2
                           prose-p:mb-2 prose-p:leading-relaxed
                           prose-ul:my-2 prose-ol:my-2 prose-li:my-1 prose-li:leading-relaxed
                           prose-ul:space-y-1 prose-ol:space-y-1
                           prose-code:text-emerald-600 prose-code:bg-emerald-50 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-xs
                           prose-pre:bg-slate-100 prose-pre:p-3 prose-pre:rounded-lg prose-pre:my-2
                           prose-strong:text-emerald-700 prose-strong:font-semibold
                           [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {m.content}
                          </ReactMarkdown>
                        </div>
                  ) : (
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{m.content}</p>
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center animate-pulse">
                  <Bot size={20} />
                </div>
                <div className="bg-white p-4 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-2">
                  <Loader2 size={16} className="animate-spin text-emerald-600" />
                  <p className="text-xs text-slate-500 font-medium italic">
                    Asisten sedang mengetik...
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="p-4 border-t bg-white">
            <div className="flex gap-2 p-1 border border-slate-200 rounded-xl focus-within:border-emerald-500 focus-within:ring-1 focus-within:ring-emerald-500 transition-all">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder="Tanyakan sesuatu..."
                className="flex-1 px-4 py-2.5 bg-transparent outline-none text-sm text-slate-800"
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || loading}
                className="p-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50"
              >
                <Send size={20} />
              </button>
            </div>
            <p className="text-[10px] text-slate-400 text-center mt-3 font-medium uppercase tracking-wider">
              AI Assistant dapat membuat kesalahan. Harap verifikasi informasi
              penting dengan admin.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
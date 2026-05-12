"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Loader2, X, MessageSquare } from "lucide-react";

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<
    { role: "ai" | "user"; content: string }[]
  >([
    {
      role: "ai",
      content:
        "Halo! Saya asisten AI Smart Cemetery. Ada yang bisa saya bantu terkait prosedur atau regulasi pemakaman?",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

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
        body: JSON.stringify({ message: userMsg }),
      });

      const data = await res.json();
      setMessages((prev) => [...prev, { role: "ai", content: data.response }]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: "ai", content: "Maaf, terjadi kesalahan koneksi." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-4 right-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-white shadow-2xl transition-all hover:scale-110 sm:bottom-8 sm:right-8 sm:h-16 sm:w-16 z-50 group cursor-pointer"
      >
        {isOpen ? (
          <X size={20} className="sm:h-6 sm:w-6" />
        ) : (
          <MessageSquare size={20} className="sm:h-6 sm:w-6" />
        )}
        {!isOpen && (
          <span className="absolute right-16 bg-white px-3 py-2 text-[10px] font-bold text-slate-900 shadow-xl border border-slate-100 opacity-0 transition-opacity whitespace-nowrap group-hover:opacity-100 sm:right-20 sm:px-4 sm:text-xs">
            Tanya AI Assistant
          </span>
        )}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-20 right-4 flex h-[26.25rem] w-[calc(100vw-2rem)] max-w-[21.25rem] flex-col overflow-hidden rounded-[1.75rem] border border-slate-100 bg-white shadow-2xl z-50 animate-in fade-in slide-in-from-bottom-4 duration-300 sm:bottom-28 sm:right-8 sm:h-[37.5rem] sm:w-[25rem] sm:max-w-none sm:rounded-[2.5rem]">
          {/* Header */}
          <div className="flex items-center gap-3 bg-primary p-4 text-white sm:gap-4 sm:p-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/20 sm:h-12 sm:w-12">
              <Bot size={22} className="sm:h-7 sm:w-7" />
            </div>
            <div>
              <h2 className="text-base font-bold leading-none sm:text-lg">
                AI Assistant
              </h2>
              <p className="mt-1 text-[9px] font-bold uppercase tracking-widest text-primary-light sm:text-[10px]">
                Smart Cemetery RAG Agent
              </p>
            </div>
          </div>

          {/* Messages */}
          <div
            ref={scrollRef}
            className="flex-1 space-y-4 overflow-y-auto bg-neutral/30 p-4 sm:space-y-6 sm:p-6"
          >
            {messages.map((m, i) => (
              <div
                key={i}
                className={`flex gap-3 ${m.role === "user" ? "flex-row-reverse" : ""}`}
              >
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                    m.role === "ai"
                      ? "bg-primary/10 text-primary"
                      : "bg-slate-200 text-slate-600"
                  }`}
                >
                  {m.role === "ai" ? <Bot size={16} /> : <User size={16} />}
                </div>
                <div
                  className={`max-w-[85%] p-4 rounded-2xl shadow-sm text-sm leading-relaxed ${
                    m.role === "ai"
                      ? "bg-white text-slate-800 rounded-tl-none border border-slate-50"
                      : "bg-primary text-white rounded-tr-none"
                  }`}
                >
                  {m.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  <Bot size={16} />
                </div>
                <div className="bg-white p-4 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-3 border border-slate-50">
                  <Loader2 size={16} className="animate-spin text-primary" />
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest italic">
                    Berpikir...
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="border-t border-slate-100 bg-white p-4 sm:p-6">
            <div className="flex gap-2 rounded-2xl border border-slate-100 bg-neutral p-1 transition-all focus-within:border-primary focus-within:ring-1 focus-within:ring-primary">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder="Tanyakan sesuatu..."
                className="flex-1 bg-transparent px-3 py-2 text-sm text-slate-800 outline-none sm:px-4 sm:py-2.5"
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || loading}
                className="rounded-xl bg-primary p-2 text-white transition-all hover:bg-primary-dark disabled:opacity-50 sm:p-2.5 cursor-pointer"
              >
                <Send size={16} className="sm:h-4.5 sm:w-4.5" />
              </button>
            </div>
            <p className="mt-3 text-center text-[8px] font-bold uppercase tracking-tighter text-slate-400 sm:mt-4 sm:text-[9px]">
              Ditenagai oleh Model Nvidia AI & Smart Cemetery Data
            </p>
          </div>
        </div>
      )}
    </>
  );
}

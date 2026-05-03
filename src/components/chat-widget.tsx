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
        className="fixed bottom-8 right-8 w-16 h-16 bg-primary text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-all z-50 group"
      >
        {isOpen ? <X size={24} /> : <MessageSquare size={24} />}
        {!isOpen && (
          <span className="absolute right-20 bg-white text-slate-900 px-4 py-2 rounded-xl text-xs font-bold shadow-xl border border-slate-100 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
            Tanya AI Assistant
          </span>
        )}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-28 right-8 w-[400px] h-[600px] bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 flex flex-col overflow-hidden z-50 animate-in fade-in slide-in-from-bottom-4 duration-300">
          {/* Header */}
          <div className="p-6 bg-primary text-white flex items-center gap-4">
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
              <Bot size={28} />
            </div>
            <div>
              <h2 className="font-bold text-lg leading-none">AI Assistant</h2>
              <p className="text-[10px] font-bold text-primary-light uppercase tracking-widest mt-1">
                Smart Cemetery RAG Agent
              </p>
            </div>
          </div>

          {/* Messages */}
          <div
            ref={scrollRef}
            className="flex-1 p-6 overflow-y-auto space-y-6 bg-neutral/30"
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
          <div className="p-6 bg-white border-t border-slate-100">
            <div className="flex gap-2 p-1 bg-neutral rounded-2xl border border-slate-100 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary transition-all">
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
                className="p-2.5 bg-primary text-white rounded-xl hover:bg-primary-dark transition-all disabled:opacity-50"
              >
                <Send size={18} />
              </button>
            </div>
            <p className="text-[9px] text-slate-400 text-center mt-4 font-bold uppercase tracking-tighter">
              Ditenagai oleh Model Nvidia AI & Smart Cemetery Data
            </p>
          </div>
        </div>
      )}
    </>
  );
}

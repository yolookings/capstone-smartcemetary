"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Loader2, Phone, MessageCircle } from "lucide-react";

const WHATSAPP_NUMBER = "6281234567890";

export default function ChatPage() {
  const [messages, setMessages] = useState<{ role: 'ai' | 'user', content: string }[]>([
    { role: 'ai', content: 'Halo! Saya asisten AI Smart Cemetery. Ada yang bisa saya bantu terkait prosedur atau regulasi pemakaman?' }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMsg = input;
    setInput("");
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMsg }),
      });

      const data = await res.json();
      setMessages(prev => [...prev, { role: 'ai', content: data.response }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'ai', content: 'Maaf, terjadi kesalahan koneksi.' }]);
    } finally {
      setLoading(false);
    }
  };

  const openWhatsApp = () => {
    const text = "Halo, saya butuh bantuan terkait Smart Cemetery";
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Hubungi Kami</h1>
          <p className="text-slate-500 text-sm">Chat dengan AI atau hubungi customer service</p>
        </div>
        <button
          onClick={openWhatsApp}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
        >
          <Phone size={18} />
          WhatsApp
        </button>
      </div>

      <div className="flex flex-col h-[calc(100vh-220px)] max-w-4xl mx-auto bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b bg-emerald-700 text-white flex items-center gap-4">
          <div className="p-2 bg-emerald-600 rounded-lg">
            <Bot size={24} />
          </div>
          <div>
            <h1 className="font-bold text-lg leading-none">AI Assistant</h1>
            <p className="text-emerald-200 text-xs mt-1">Smart Cemetery RAG Agent</p>
          </div>
        </div>

        <div ref={scrollRef} className="flex-1 p-6 overflow-y-auto space-y-6 bg-slate-50/50">
          {messages.map((m, i) => (
            <div key={i} className={`flex gap-4 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                m.role === 'ai' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'
              }`}>
                {m.role === 'ai' ? <Bot size={20} /> : <User size={20} />}
              </div>
              <div className={`max-w-[80%] p-4 rounded-2xl shadow-sm ${
                m.role === 'ai' 
                  ? 'bg-white text-slate-800 rounded-tl-none' 
                  : 'bg-emerald-600 text-white rounded-tr-none'
              }`}>
                <p className="text-sm leading-relaxed">{m.content}</p>
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
                <p className="text-xs text-slate-500 font-medium italic">Asisten sedang mengetik...</p>
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
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
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
            AI Assistant dapat membuat kesalahan. Harap verifikasi informasi penting dengan admin.
          </p>
        </div>
      </div>
    </div>
  );
}
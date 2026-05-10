"use client";

import { useEffect, useRef, useState } from "react";
import { useTripStore } from "@/store/tripStore";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const QUICK_PROMPTS = [
  "Quais são as melhores dicas para esta viagem?",
  "O que devo saber sobre o clima?",
  "Sugestões de restaurantes locais?",
  "Como se locomover entre os locais?",
];

export default function AiPanel() {
  const { trip } = useTripStore();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: `Olá! 👋 Sou seu assistente para a viagem **${trip.name}**. Posso responder dúvidas, dar dicas e sugestões. Como posso ajudar?`,
    },
  ]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || isStreaming) return;

    const userMsg: Message = { role: "user", content: text };
    const history = messages.filter((m) => m.role !== "assistant" || messages.indexOf(m) > 0);

    setMessages((prev) => [...prev, userMsg, { role: "assistant", content: "" }]);
    setInput("");
    setIsStreaming(true);

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, history, trip }),
      });

      if (!res.body) throw new Error("No stream");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        accumulated += decoder.decode(value, { stream: true });
        const current = accumulated;
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = { role: "assistant", content: current };
          return updated;
        });
      }
    } catch {
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          role: "assistant",
          content: "Desculpe, ocorreu um erro. Tente novamente.",
        };
        return updated;
      });
    } finally {
      setIsStreaming(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const renderText = (text: string) =>
    text
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.*?)\*/g, "<em>$1</em>")
      .replace(/\n/g, "<br/>");

  return (
    <div
      className="fixed z-40 flex flex-col bottom-[calc(56px+8px)] right-4 md:bottom-6 md:right-auto md:left-[272px]"
      style={{ width: "min(380px, calc(100vw - 32px))" }}
    >
      {/* Panel — cresce para cima a partir do botão */}
      <div
        className={`transition-all duration-300 overflow-hidden ${
          isOpen ? "opacity-100 mb-2" : "opacity-0 h-0 mb-0 pointer-events-none"
        }`}
      >
        <div className="bg-[#111827] rounded-2xl border border-white/10 shadow-2xl flex flex-col" style={{ height: "520px" }}>
          {/* Header */}
          <div className="flex items-center gap-3 px-5 py-4 border-b border-white/10 bg-gradient-to-r from-violet-600/20 to-indigo-600/20 shrink-0 rounded-t-2xl">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2a10 10 0 0 1 10 10c0 5.52-4.48 10-10 10a9.96 9.96 0 0 1-5.06-1.38L2 22l1.38-4.94A9.96 9.96 0 0 1 2 12C2 6.48 6.48 2 12 2z" />
                <path d="M8 12h.01M12 12h.01M16 12h.01" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-white">Assistente de IA</p>
              <p className="text-xs text-slate-400 truncate">{trip.name}</p>
            </div>
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                {msg.role === "assistant" && (
                  <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shrink-0 mr-2 mt-1">
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 2a10 10 0 0 1 10 10c0 5.52-4.48 10-10 10a9.96 9.96 0 0 1-5.06-1.38L2 22l1.38-4.94A9.96 9.96 0 0 1 2 12C2 6.48 6.48 2 12 2z" />
                      <path d="M8 12h.01M12 12h.01M16 12h.01" />
                    </svg>
                  </div>
                )}
                <div
                  className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "bg-violet-600 text-white rounded-tr-sm"
                      : "bg-white/8 text-slate-200 rounded-tl-sm border border-white/10"
                  }`}
                >
                  {msg.content === "" && isStreaming ? (
                    <div className="flex gap-1 py-1">
                      <div className="w-2 h-2 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                      <div className="w-2 h-2 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                      <div className="w-2 h-2 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                  ) : (
                    <span dangerouslySetInnerHTML={{ __html: renderText(msg.content) }} />
                  )}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick prompts */}
          {messages.length <= 1 && (
            <div className="px-4 pb-2 flex flex-wrap gap-1.5 shrink-0">
              {QUICK_PROMPTS.map((q) => (
                <button
                  key={q}
                  onClick={() => sendMessage(q)}
                  className="text-xs px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:bg-violet-600/20 hover:border-violet-500 hover:text-violet-300 transition-all cursor-pointer"
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="px-4 py-3 border-t border-white/10 flex gap-2 shrink-0">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Pergunte qualquer coisa..."
              disabled={isStreaming}
              className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 transition-all disabled:opacity-50"
            />
            <button
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || isStreaming}
              className="w-10 h-10 rounded-xl bg-violet-600 flex items-center justify-center text-white hover:bg-violet-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer shrink-0"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Toggle button — sempre visível na base */}
      <button
        onClick={() => setIsOpen((o) => !o)}
        className="flex items-center gap-2 px-4 py-3 rounded-2xl shadow-2xl font-semibold text-sm transition-all duration-200 cursor-pointer bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:opacity-90 shadow-violet-500/40"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2a10 10 0 0 1 10 10c0 5.52-4.48 10-10 10a9.96 9.96 0 0 1-5.06-1.38L2 22l1.38-4.94A9.96 9.96 0 0 1 2 12C2 6.48 6.48 2 12 2z" />
          <path d="M8 12h.01M12 12h.01M16 12h.01" />
        </svg>
        {isOpen ? "Fechar assistente" : "Assistente de IA"}
        <svg
          xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
          className={`ml-auto transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
        >
          <polyline points="18 15 12 9 6 15" />
        </svg>
      </button>
    </div>
  );
}

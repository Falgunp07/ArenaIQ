import { useEffect, useRef, useState } from "react";
import {
  Clock3,
  MapPinned,
  SendHorizonal,
  Sparkles,
  UtensilsCrossed,
  Waypoints,
} from "lucide-react";
import useChat from "../hooks/useChat";

const QUICK_ACTIONS = [
  { text: "Which gate is least crowded right now?", icon: MapPinned },
  { text: "Find quick vegetarian options nearby", icon: UtensilsCrossed },
  { text: "Current restroom wait times?", icon: Clock3 },
  { text: "Best route from Gate A to Section C", icon: Waypoints },
];

export default function ChatInterface() {
  const { messages, loading, sendMessage } = useChat();
  const [input, setInput] = useState("");
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (messages.length > 0 || loading) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, loading]);

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!input.trim()) return;

    sendMessage(input);
    setInput("");
  };

  const handleQuickAction = (text) => {
    sendMessage(text);
  };

  return (
    <section className="flex h-full min-h-0 flex-col rounded-2xl border border-[#1e293b] bg-[#0f172a] shadow-lg overflow-hidden" aria-label="Chat with ArenaIQ assistant">
      <div className="border-b border-[#1e293b] bg-[#1e293b]/40 px-5 py-4 shrink-0">
        <div className="flex items-center justify-between gap-3">
          <div className="flex flex-col gap-1">
            <h2 className="text-sm font-bold uppercase tracking-widest text-[#f8fafc] flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-blue-600" />
              AI Assistant
            </h2>
            <p className="text-[11px] text-[#94a3b8]">Live guidance and route context.</p>
          </div>
        </div>
      </div>

      <div
        className="flex-1 flex flex-col gap-4 overflow-y-auto px-5 py-5 scrollbar-thin overflow-x-hidden min-h-25"
        role="log"
        aria-label="Chat messages"
        aria-live="polite"
      >
        {messages.length === 0 && (
          <div className="flex h-full min-h-55 flex-col items-center justify-center rounded-2xl border border-dashed border-[#1e293b] bg-[#0f172a]/40 px-5 py-6 text-center">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600/20 text-blue-600 shadow-[0_0_20px_rgba(37,99,235,0.3)]">
              <Sparkles className="h-6 w-6" />
            </div>
            <h3 className="text-base font-bold text-white">How can I assist?</h3>
            <p className="mt-2 max-w-[40ch] text-[13px] leading-relaxed text-[#94a3b8]">
              Ask about crowd levels, food options, or find the shortest routes.
            </p>

            <div className="mt-5 flex flex-wrap justify-center gap-2">
              {QUICK_ACTIONS.map((action) => {
                const Icon = action.icon;
                return (
                  <button key={action.text} onClick={() => handleQuickAction(action.text)} className="chip text-[11px] py-1.5 px-3 bg-[#1e293b] border-[#334155] text-[#cbd5e1] hover:bg-[#334155] transition-colors rounded-full flex grid-flow-col items-center justify-center">
                    <Icon className="h-3 w-3 mr-1.5 inline-block" />
                    {action.text}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex w-full ${msg.role === "user" ? "justify-end" : "justify-start gap-2"}`}
            aria-label={`${msg.role === "user" ? "You" : "ArenaIQ"}: ${msg.text}`}
          >
            {msg.role === "assistant" && (
              <div className="shrink-0 flex h-7 w-7 items-center justify-center rounded-full bg-blue-600/10 border border-accent-blue/20 text-blue-600">
                <Sparkles className="h-3.5 w-3.5" />
              </div>
            )}

            <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-[13px] leading-relaxed shadow-sm ${msg.role === 'user' ? 'bg-blue-600 text-white rounded-tr-sm' : 'bg-[#1e293b]/70 border border-[#334155]/50 text-[#f8fafc] rounded-tl-sm backdrop-blur-md'}`}>
              <p className="whitespace-pre-wrap">{msg.text}</p>
              <time className={`mt-1.5 block text-[9px] font-medium tracking-wider uppercase opacity-60 ${msg.role === 'user' ? 'text-blue-100 text-right' : 'text-[#64748b]'}`}>
                {new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </time>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex items-start gap-2 w-full">
            <div className="shrink-0 flex h-7 w-7 items-center justify-center rounded-full bg-blue-600/10 border border-accent-blue/20 text-blue-600">
              <Sparkles className="h-3.5 w-3.5" />
            </div>
            <div className="flex items-center gap-1.5 rounded-2xl bg-[#1e293b]/70 border border-[#334155]/50 px-4 py-4 rounded-tl-sm backdrop-blur-md">
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#64748b] [animation-delay:-0.3s]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#64748b] [animation-delay:-0.15s]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#64748b]" />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {messages.length > 0 && messages.length < 6 && (
        <div className="flex gap-2 overflow-x-auto border-t border-[#1e293b] px-4 py-3 shrink-0 scrollbar-hide">
          {QUICK_ACTIONS.slice(0, 3).map((action) => {
            const Icon = action.icon;
            return (
              <button key={action.text} onClick={() => handleQuickAction(action.text)} className="shrink-0 rounded-full border border-[#334155] bg-[#1e293b]/60 px-3 py-1.5 text-[11px] text-[#cbd5e1] hover:bg-[#334155]">
                <Icon className="mr-1.5 inline h-3 w-3" />
                {action.text}
              </button>
            );
          })}
        </div>
      )}

      <form onSubmit={handleSubmit} className="shrink-0 border-t border-[#1e293b] bg-[#020617]/40 p-4">
        <div className="flex items-center gap-2 rounded-2xl border border-[#334155]/60 bg-[#0f172a] shadow-inner p-1.5 focus-within:border-accent-blue/50 focus-within:ring-1 focus-within:ring-accent-blue/50 transition-all">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Type here..."
            disabled={loading}
            className="flex-1 bg-transparent px-3.5 py-2.5 text-sm text-[#f8fafc] placeholder:text-[#64748b] focus:outline-none disabled:opacity-50"
            aria-label="Type your message"
            id="chat-input"
          />

          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-lg shadow-accent-blue/20 transition-transform hover:scale-105 active:scale-95 disabled:pointer-events-none disabled:opacity-40"
            aria-label="Send message"
            id="chat-send-btn"
          >
            <SendHorizonal className="h-4.5 w-4.5" />
          </button>
        </div>
      </form>
    </section>
  );
}

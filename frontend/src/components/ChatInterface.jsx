/**
 * ChatInterface.jsx — Main chat UI for attendees
 *
 * Full-height chat panel with message history, quick-action chips,
 * typing indicator, and input bar. Communicates with the Gemini
 * backend via the useChat hook.
 */

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { HiOutlinePaperAirplane } from "react-icons/hi";
import { MdStadium } from "react-icons/md";
import { BsLightningCharge, BsMap, BsClock, BsCupStraw } from "react-icons/bs";
import useChat from "../hooks/useChat";

const QUICK_ACTIONS = [
  { text: "Which gate is least crowded?", icon: BsMap },
  { text: "What's the nearest vegetarian food?", icon: BsCupStraw },
  { text: "Restroom wait times?", icon: BsClock },
  { text: "Guide me from Gate A to Section C", icon: BsLightningCharge },
];

export default function ChatInterface() {
  const { messages, loading, sendMessage } = useChat();
  const [input, setInput] = useState("");
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (input.trim()) {
      sendMessage(input);
      setInput("");
    }
  };

  const handleQuickAction = (text) => {
    sendMessage(text);
  };

  return (
    <section
      className="flex flex-col h-full"
      aria-label="Chat with ArenaIQ assistant"
    >
      {/* Messages Area */}
      <div
        className="flex-1 overflow-y-auto px-4 py-6 space-y-4"
        role="log"
        aria-label="Chat messages"
        aria-live="polite"
      >
        {/* Welcome Message */}
        {messages.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col items-center justify-center h-full text-center py-12"
          >
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent-blue to-accent-cyan flex items-center justify-center mb-5 glow-blue">
              <MdStadium className="text-white text-3xl" />
            </div>
            <h2 className="text-2xl font-bold text-text-primary mb-2">
              Welcome to Arena<span className="text-accent-cyan">IQ</span>
            </h2>
            <p className="text-text-secondary text-sm max-w-md mb-8 leading-relaxed">
              Your AI stadium assistant. Ask about crowd levels,
              wait times, food options, or directions — I've got real-time data
              from across the venue.
            </p>

            {/* Quick Actions */}
            <div className="flex flex-wrap justify-center gap-2 max-w-lg">
              {QUICK_ACTIONS.map((action) => {
                const Icon = action.icon;
                return (
                  <button
                    key={action.text}
                    onClick={() => handleQuickAction(action.text)}
                    className="chip"
                  >
                    <Icon />
                    {action.text}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Chat Messages */}
        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              aria-label={`${msg.role === "user" ? "You" : "ArenaIQ"}: ${msg.text}`}
            >
              {msg.role === "assistant" && (
                <div className="flex-shrink-0 w-7 h-7 rounded-lg bg-gradient-to-br from-accent-blue to-accent-cyan flex items-center justify-center mr-2 mt-1">
                  <MdStadium className="text-white text-xs" />
                </div>
              )}
              <div
                className={
                  msg.role === "user"
                    ? "chat-bubble-user"
                    : `chat-bubble-assistant ${msg.isError ? "border-accent-red/30" : ""}`
                }
              >
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                <time className="block text-[10px] mt-1.5 opacity-50">
                  {new Date(msg.timestamp).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </time>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Typing Indicator */}
        {loading && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-start"
            role="status"
            aria-label="ArenaIQ is thinking"
          >
            <div className="flex-shrink-0 w-7 h-7 rounded-lg bg-gradient-to-br from-accent-blue to-accent-cyan flex items-center justify-center mr-2 mt-1">
              <MdStadium className="text-white text-xs" />
            </div>
            <div className="chat-bubble-assistant flex items-center gap-1 py-3 px-4">
              <span className="typing-dot" />
              <span className="typing-dot" />
              <span className="typing-dot" />
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Actions (after first message) */}
      {messages.length > 0 && messages.length < 6 && (
        <div className="px-4 py-2 flex gap-2 overflow-x-auto scrollbar-none">
          {QUICK_ACTIONS.slice(0, 3).map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.text}
                onClick={() => handleQuickAction(action.text)}
                className="chip text-xs flex-shrink-0"
              >
                <Icon />
                {action.text}
              </button>
            );
          })}
        </div>
      )}

      {/* Input Bar */}
      <form
        onSubmit={handleSubmit}
        className="px-4 py-3 border-t border-stadium-border"
        style={{ backgroundColor: "rgba(17, 24, 39, 0.8)" }}
      >
        <div className="flex items-center gap-2 max-w-3xl mx-auto">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about gates, food, wait times..."
            disabled={loading}
            className="flex-1 bg-stadium-card border border-stadium-border rounded-xl px-4 py-3 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-cyan focus:ring-1 focus:ring-accent-cyan/30 transition-colors disabled:opacity-50"
            aria-label="Type your message"
            id="chat-input"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="flex-shrink-0 w-11 h-11 rounded-xl bg-gradient-to-r from-accent-blue to-accent-cyan flex items-center justify-center text-white transition-all hover:shadow-lg hover:shadow-accent-blue/20 disabled:opacity-40 disabled:cursor-not-allowed"
            aria-label="Send message"
            id="chat-send-btn"
          >
            <HiOutlinePaperAirplane className="text-lg rotate-90" />
          </button>
        </div>
      </form>
    </section>
  );
}

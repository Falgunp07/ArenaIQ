/**
 * useChat.js — Chat state management + API calls
 *
 * Manages conversation messages, sends user messages to the
 * backend /chat endpoint, and handles loading / error states.
 */

import { useState, useCallback, useRef } from "react";

export function useChat() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const sessionIdRef = useRef(
    sessionStorage.getItem("arenaiq_session") || crypto.randomUUID()
  );

  // Persist session ID
  if (!sessionStorage.getItem("arenaiq_session")) {
    sessionStorage.setItem("arenaiq_session", sessionIdRef.current);
  }

  const sendMessage = useCallback(
    async (text) => {
      if (!text.trim() || loading) return;

      const userMsg = {
        id: crypto.randomUUID(),
        role: "user",
        text: text.trim(),
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, userMsg]);
      setLoading(true);
      setError(null);

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: text.trim(),
            sessionId: sessionIdRef.current,
          }),
        });

        let data;
        try {
          data = await res.json();
        } catch {
          data = {};
        }

        if (!res.ok) {
          throw new Error(data.error || `Server error: ${res.status}`);
        }

        const assistantMsg = {
          id: crypto.randomUUID(),
          role: "assistant",
          text: data.reply || "I couldn't process that. Please try again.",
          timestamp: new Date().toISOString(),
        };

        setMessages((prev) => [...prev, assistantMsg]);
      } catch (err) {
        console.error("[useChat] Error:", err.message);
        setError(err.message);

        const errorMsg = {
          id: crypto.randomUUID(),
          role: "assistant",
          text: err.message.includes("API Error") ? err.message : "Sorry, I'm having trouble connecting right now. Please try again in a moment.",
          timestamp: new Date().toISOString(),
          isError: true,
        };
        setMessages((prev) => [...prev, errorMsg]);
      } finally {
        setLoading(false);
      }
    },
    [loading]
  );

  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  return { messages, loading, error, sendMessage, clearMessages };
}

export default useChat;

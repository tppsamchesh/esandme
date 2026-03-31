"use client";

import { MessageCircle, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

type Role = "user" | "assistant";

type ChatMessage = {
  id: string;
  role: Role;
  content: string;
  isError?: boolean;
};

const WELCOME =
  "Hi! I'm the Es & Me assistant. I can help you find the perfect product, answer questions about delivery and returns, or help you track your order. What can I help you with today?";

function buildPayload(messages: ChatMessage[]) {
  return messages
    .filter((m) => !m.isError)
    .map((m) => ({ role: m.role, content: m.content }));
}

export function ChatBot() {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith("/admin") ?? false;

  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [pendingCollectDetails, setPendingCollectDetails] = useState(false);
  const [collectName, setCollectName] = useState("");
  const [collectEmail, setCollectEmail] = useState("");
  const [collectSubmitting, setCollectSubmitting] = useState(false);
  const [collectDone, setCollectDone] = useState(false);

  const listRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      listRef.current?.scrollTo({
        top: listRef.current.scrollHeight,
        behavior: "smooth",
      });
    });
  }, []);

  useEffect(() => {
    if (!open) return;
    setMessages((prev) => {
      if (prev.length > 0) return prev;
      return [
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: WELCOME,
        },
      ];
    });
  }, [open]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading, open, scrollToBottom]);

  const parseAssistantReply = (data: Record<string, unknown>) => {
    const text =
      (typeof data.reply === "string" && data.reply) ||
      (typeof data.message === "string" && data.message) ||
      (typeof data.content === "string" && data.content) ||
      (typeof data.text === "string" && data.text) ||
      "";
    const collect_details = Boolean(data.collect_details);
    return { text, collect_details };
  };

  const sendMessage = async () => {
    const trimmed = input.trim();
    if (!trimmed || loading) return;

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: trimmed,
    };

    setPendingCollectDetails(false);
    setCollectDone(false);
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    const history = buildPayload([...messages, userMsg]);

    try {
      const res = await fetch("/api/chatbot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history }),
      });

      const data = (await res.json().catch(() => ({}))) as Record<
        string,
        unknown
      >;

      if (!res.ok) {
        setMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: "assistant",
            content:
              "Sorry, something went wrong. Please try again.",
            isError: true,
          },
        ]);
        return;
      }

      const { text, collect_details } = parseAssistantReply(data);
      let replyText = text;
      if (!replyText && collect_details) {
        replyText =
          "Please share your contact details below — we'd love to follow up.";
      } else if (!replyText) {
        replyText = "Sorry, something went wrong. Please try again.";
      }

      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: replyText,
          isError: !text && !collect_details,
        },
      ]);

      if (collect_details) {
        setPendingCollectDetails(true);
        setCollectName("");
        setCollectEmail("");
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content:
            "Sorry, something went wrong. Please try again.",
          isError: true,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const submitCollectDetails = async () => {
    if (collectSubmitting) return;
    setCollectSubmitting(true);
    try {
      const conversation = buildPayload(messages);
      const res = await fetch("/api/chatbot/collect-details", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversation,
          name: collectName.trim(),
          email: collectEmail.trim(),
        }),
      });
      if (res.ok) {
        setPendingCollectDetails(false);
        setCollectDone(true);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: "assistant",
            content:
              "Sorry, something went wrong. Please try again.",
            isError: true,
          },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content:
            "Sorry, something went wrong. Please try again.",
          isError: true,
        },
      ]);
    } finally {
      setCollectSubmitting(false);
    }
  };

  if (isAdmin) {
    return null;
  }

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col items-end gap-3">
      {open && (
        <div className="flex h-[500px] w-[380px] max-w-[calc(100vw-48px)] flex-col overflow-hidden rounded-2xl border border-brand-text/10 bg-white shadow-xl">
          <div className="shrink-0 bg-brand-primary px-4 py-3 text-white">
            <p className="font-heading text-lg font-medium">
              Hi! I&apos;m here to help 👋
            </p>
          </div>

          <div
            ref={listRef}
            className="min-h-0 flex-1 space-y-3 overflow-y-auto p-3"
          >
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={
                    m.role === "user"
                      ? "max-w-[85%] rounded-2xl rounded-br-sm bg-brand-primary px-3 py-2 text-sm text-white"
                      : "max-w-[85%] rounded-2xl rounded-bl-sm border border-brand-text/15 bg-brand-bg px-3 py-2 text-sm text-brand-text"
                  }
                >
                  {m.content}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div
                  className="inline-flex items-center gap-1.5 rounded-2xl rounded-bl-sm border border-brand-text/15 bg-brand-bg px-4 py-3"
                  role="status"
                  aria-label="Assistant is typing"
                >
                  <span
                    className="h-2 w-2 animate-bounce rounded-full bg-brand-primary/60"
                    style={{ animationDelay: "0ms" }}
                  />
                  <span
                    className="h-2 w-2 animate-bounce rounded-full bg-brand-primary/60"
                    style={{ animationDelay: "150ms" }}
                  />
                  <span
                    className="h-2 w-2 animate-bounce rounded-full bg-brand-primary/60"
                    style={{ animationDelay: "300ms" }}
                  />
                </div>
              </div>
            )}

            {pendingCollectDetails && !collectDone && (
              <div className="rounded-xl border border-brand-secondary/40 bg-brand-bg/80 p-3">
                <label className="block text-xs text-brand-text/80">
                  Name
                  <input
                    type="text"
                    value={collectName}
                    onChange={(e) => setCollectName(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-brand-text/20 bg-white px-2 py-1.5 text-sm text-brand-text"
                    autoComplete="name"
                  />
                </label>
                <label className="mt-2 block text-xs text-brand-text/80">
                  Email
                  <input
                    type="email"
                    value={collectEmail}
                    onChange={(e) => setCollectEmail(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-brand-text/20 bg-white px-2 py-1.5 text-sm text-brand-text"
                    autoComplete="email"
                  />
                </label>
                <button
                  type="button"
                  onClick={submitCollectDetails}
                  disabled={
                    collectSubmitting ||
                    !collectName.trim() ||
                    !collectEmail.trim()
                  }
                  className="mt-3 w-full rounded-lg bg-brand-primary py-2 text-sm font-medium text-white transition-opacity hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {collectSubmitting ? "Sending…" : "Submit"}
                </button>
              </div>
            )}

            {collectDone && (
              <p className="rounded-lg border border-brand-primary/30 bg-brand-bg px-3 py-2 text-sm text-brand-text">
                Thanks! Someone from our team will be in touch shortly.
              </p>
            )}
          </div>

          <div className="shrink-0 border-t border-brand-text/10 p-3">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    void sendMessage();
                  }
                }}
                placeholder="Type a message…"
                className="min-w-0 flex-1 rounded-lg border border-brand-text/20 px-3 py-2 text-sm text-brand-text placeholder:text-brand-text/40"
                disabled={loading}
                aria-label="Message"
              />
              <button
                type="button"
                onClick={() => void sendMessage()}
                disabled={loading || !input.trim()}
                className="shrink-0 rounded-lg bg-brand-primary px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-primary text-white shadow-lg transition-opacity hover:opacity-95"
        aria-expanded={open}
        aria-label={open ? "Close chat" : "Open chat"}
      >
        {open ? (
          <X className="h-6 w-6" strokeWidth={2} />
        ) : (
          <MessageCircle className="h-6 w-6" strokeWidth={2} />
        )}
      </button>
    </div>
  );
}

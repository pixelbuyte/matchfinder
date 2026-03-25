"use client";
import { useState, useEffect, useRef } from "react";

interface Message {
  id: number;
  message: string;
  createdAt: string;
  userId: number;
  displayName: string | null;
  email: string;
}

export default function MatchChat({
  matchId,
  currentUserId,
}: {
  matchId: number;
  currentUserId: number | null;
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  async function load() {
    const res = await fetch(`/api/chat/${matchId}`);
    if (res.ok) {
      const data = await res.json();
      setMessages(data);
    }
  }

  useEffect(() => {
    load();
    const interval = setInterval(load, 4000);
    return () => clearInterval(interval);
  }, [matchId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim() || sending) return;
    setSending(true);
    await fetch(`/api/chat/${matchId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: text.trim() }),
    });
    setText("");
    setSending(false);
    load();
  }

  const name = (m: Message) => m.displayName ?? m.email.split("@")[0];

  return (
    <div className="bg-white rounded-xl shadow p-6">
      <h2 className="font-semibold text-gray-800 mb-3">Group Chat</h2>
      <div className="h-64 overflow-y-auto border border-gray-100 rounded-lg p-3 space-y-3 bg-gray-50 mb-3">
        {messages.length === 0 && (
          <p className="text-xs text-gray-400 text-center pt-8">No messages yet. Say hi!</p>
        )}
        {messages.map((m) => {
          const isMe = m.userId === currentUserId;
          return (
            <div key={m.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-xs rounded-2xl px-3 py-2 text-sm ${isMe ? "bg-blue-600 text-white" : "bg-white border border-gray-200 text-gray-800"}`}>
                {!isMe && (
                  <p className="text-xs font-semibold mb-0.5 text-blue-600">{name(m)}</p>
                )}
                <p>{m.message}</p>
                <p className={`text-xs mt-0.5 ${isMe ? "text-blue-200" : "text-gray-400"}`}>
                  {new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>
      {currentUserId ? (
        <form onSubmit={send} className="flex gap-2">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type a message..."
            maxLength={500}
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={sending || !text.trim()}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-50"
          >
            Send
          </button>
        </form>
      ) : (
        <p className="text-sm text-gray-500 text-center">
          <a href="/auth/login" className="text-blue-600 hover:underline">Log in</a> to chat.
        </p>
      )}
    </div>
  );
}

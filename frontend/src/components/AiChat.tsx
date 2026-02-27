"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { chatStream, ChatMessage } from "@/lib/api";
import { NdaFormData } from "@/lib/types";

interface AiChatProps {
  onFieldsUpdate: (fields: Partial<NdaFormData>) => void;
}

export default function AiChat({ onFieldsUpdate }: AiChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [streamingContent, setStreamingContent] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const hasGreeted = useRef(false);

  const sendToApi = useCallback(
    async (apiMessages: ChatMessage[]) => {
      setIsStreaming(true);
      setStreamingContent("");
      setError(null);
      let accumulated = "";

      await chatStream(apiMessages, {
        onToken: (token) => {
          accumulated += token;
          setStreamingContent(accumulated);
        },
        onFields: onFieldsUpdate,
        onDone: () => {
          setMessages((prev) => [
            ...prev,
            { role: "assistant", content: accumulated },
          ]);
          setStreamingContent(null);
          setIsStreaming(false);
        },
        onError: (err) => {
          setError(err);
          setStreamingContent(null);
          setIsStreaming(false);
        },
      });
    },
    [onFieldsUpdate]
  );

  // Kick off the initial AI greeting on mount
  useEffect(() => {
    if (hasGreeted.current) return;
    hasGreeted.current = true;
    sendToApi([]);
  }, [sendToApi]);

  // Auto-scroll to the latest message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingContent]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || isStreaming) return;

    const userMessage: ChatMessage = { role: "user", content: input.trim() };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    sendToApi(newMessages);
  }

  return (
    <div className="flex flex-col h-full">
      <div className="mb-4 pb-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">AI Assistant</h2>
        <p className="text-xs text-gray-500">
          Chat with our AI to fill in your Mutual NDA
        </p>
      </div>

      {/* Message list */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-1">
        {messages.map((msg, i) => (
          <MessageBubble key={i} message={msg} />
        ))}

        {streamingContent !== null && (
          <MessageBubble
            message={{ role: "assistant", content: streamingContent }}
            isStreaming
          />
        )}

        {error && (
          <div className="rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input bar */}
      <form
        onSubmit={handleSubmit}
        className="flex gap-2 pt-4 border-t border-gray-200 mt-4"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={isStreaming}
          placeholder={isStreaming ? "AI is typing…" : "Type your response…"}
          className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-400"
        />
        <button
          type="submit"
          disabled={isStreaming || !input.trim()}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Send
        </button>
      </form>
    </div>
  );
}

function MessageBubble({
  message,
  isStreaming = false,
}: {
  message: ChatMessage;
  isStreaming?: boolean;
}) {
  const isUser = message.role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
          isUser
            ? "bg-blue-600 text-white rounded-br-sm"
            : "bg-gray-100 text-gray-800 rounded-bl-sm"
        }`}
      >
        {message.content}
        {isStreaming && (
          <span className="inline-block w-1.5 h-3.5 ml-0.5 bg-current animate-pulse rounded-sm align-middle opacity-70" />
        )}
      </div>
    </div>
  );
}

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { chatRequest, ChatMessage } from "@/lib/api";
import { renderMarkdown } from "@/lib/markdown";

interface AiChatProps {
  onFieldsUpdate: (fields: Record<string, string>) => void;
  onDocumentSelected?: (name: string, slug: string) => void;
  documentType?: string;
  variables?: string[];
}

export default function AiChat({
  onFieldsUpdate,
  onDocumentSelected,
  documentType,
  variables,
}: AiChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  // Phase 1: empty string = pulsing cursor while waiting; null = not in-flight
  // Phase 2: string with content = typewriter reveal
  const [typingContent, setTypingContent] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const hasGreeted = useRef(false);
  const typingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (typingIntervalRef.current !== null) {
        clearInterval(typingIntervalRef.current);
      }
    };
  }, []);

  const sendToApi = useCallback(
    async (apiMessages: ChatMessage[]) => {
      // Phase 1: show pulsing cursor while waiting
      setIsStreaming(true);
      setTypingContent("");
      setError(null);

      let response;
      try {
        response = await chatRequest(apiMessages, documentType, variables);
      } catch (err) {
        setTypingContent(null);
        setIsStreaming(false);
        setError(err instanceof Error ? err.message : "Network error");
        return;
      }

      const { content, fields, document_selected } = response;

      // Apply fields and document selection at the START of reveal
      if (fields && Object.keys(fields).length > 0) {
        onFieldsUpdate(fields);
      }
      if (document_selected) {
        onDocumentSelected?.(document_selected.name, document_selected.slug);
      }

      // Phase 2: typewriter reveal
      const delay = Math.max(8, Math.min(25, 3000 / (content.length || 1)));
      let charIndex = 0;

      // Clear any existing interval
      if (typingIntervalRef.current !== null) {
        clearInterval(typingIntervalRef.current);
      }

      typingIntervalRef.current = setInterval(() => {
        charIndex++;
        const revealed = content.slice(0, charIndex);
        setTypingContent(revealed);

        if (charIndex >= content.length) {
          clearInterval(typingIntervalRef.current!);
          typingIntervalRef.current = null;
          // Move revealed content into messages, clear typing state
          setMessages((prev) => [
            ...prev,
            { role: "assistant", content },
          ]);
          setTypingContent(null);
          setIsStreaming(false);
          inputRef.current?.focus();
        }
      }, delay);
    },
    [onFieldsUpdate, onDocumentSelected, documentType, variables]
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
  }, [messages, typingContent]);

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
          {documentType
            ? `Chat with our AI to fill in your ${documentType}`
            : "Tell us what kind of document you need"}
        </p>
      </div>

      {/* Message list */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-1">
        {messages.map((msg, i) => (
          <MessageBubble key={i} message={msg} />
        ))}

        {typingContent !== null && (
          <MessageBubble
            message={{ role: "assistant", content: typingContent }}
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
          ref={inputRef}
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
        {isUser ? (
          message.content
        ) : (
          // Content is sanitized by DOMPurify inside renderMarkdown
          <div
            className="prose prose-sm max-w-none prose-p:my-1 prose-ul:my-1 prose-li:my-0"
            dangerouslySetInnerHTML={{ __html: renderMarkdown(message.content) }}
          />
        )}
        {isStreaming && (
          <span className="inline-block w-1.5 h-3.5 ml-0.5 bg-current animate-pulse rounded-sm align-middle opacity-70" />
        )}
      </div>
    </div>
  );
}

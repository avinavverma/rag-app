"use client";

import React, {
  useEffect,
  useRef,
  useState,
} from "react";

import { Send } from "lucide-react";

import { Button } from "@/components/ui/button";

import { SourceCard } from "@/components/source-card";

import { useStream } from "@/hooks/useStream";

import type {
  ChatMessage,
  StreamSource,
} from "@/types";

interface ChatPanelProps {
  documentId: string;
  userId: string;

  messages: ChatMessage[];

  onMessagesChange: React.Dispatch<
    React.SetStateAction<ChatMessage[]>
  >;

  onCitationClick: (
    pageNumber: number
  ) => void;
}

export function ChatPanel({
  documentId,
  userId,
  messages,
  onMessagesChange,
  onCitationClick,
}: ChatPanelProps) {
  const [question, setQuestion] =
    useState("");

  const {
    send,
    isStreaming,
    error,
  } = useStream();

  const messagesEndRef =
    useRef<HTMLDivElement | null>(
      null
    );

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView(
      {
        behavior: "smooth",
      }
    );
  }, [messages]);

  useEffect(() => {
    if (!error) return;

    onMessagesChange((prev) =>
      prev.map((msg) =>
        msg.isStreaming
          ? {
            ...msg,
            isStreaming: false,
            content:
              msg.content ||
              `Error: ${error}`,
          }
          : msg
      )
    );
  }, [error, onMessagesChange]);

  async function handleSend() {
    const trimmed =
      question.trim();

    if (
      !trimmed ||
      isStreaming
    ) {
      return;
    }

    const userMessage: ChatMessage =
    {
      id: crypto.randomUUID(),
      role: "user",
      content: trimmed,
    };

    const assistantMessageId =
      crypto.randomUUID();

    const assistantMessage: ChatMessage =
    {
      id: assistantMessageId,
      role: "assistant",
      content: "",
      sources: [],
      isStreaming: true,
    };

    onMessagesChange((prev) => [
      ...prev,
      userMessage,
      assistantMessage,
    ]);

    setQuestion("");

    await send(
      trimmed,
      documentId,
      userId,
      {
        onSources: (
          sources: StreamSource[]
        ) => {
          onMessagesChange(
            (prev) =>
              prev.map((msg) =>
                msg.id ===
                  assistantMessageId
                  ? {
                    ...msg,
                    sources,
                  }
                  : msg
              )
          );
        },

        onToken: (
          token: string
        ) => {
          onMessagesChange(
            (prev) =>
              prev.map((msg) =>
                msg.id ===
                  assistantMessageId
                  ? {
                    ...msg,
                    content:
                      msg.content +
                      token,
                  }
                  : msg
              )
          );
        },

        onDone: () => {
          onMessagesChange(
            (prev) =>
              prev.map((msg) =>
                msg.id ===
                  assistantMessageId
                  ? {
                    ...msg,
                    isStreaming: false,
                  }
                  : msg
              )
          );
        },
      }
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="chat-scroll flex-1 space-y-6 overflow-y-auto px-2">
        {messages.length ===
          0 &&
          !isStreaming && (
            <div className="flex h-full min-h-[200px] flex-col items-center justify-center rounded-md border border-border bg-card p-8 text-center text-sm text-muted-foreground">
              <p className="font-medium text-foreground">
                No messages yet
              </p>

              <p className="mt-2 max-w-xs">
                Ask a question
                about this
                document.
                Answers stream
                in with source
                citations you
                can click to
                jump to pages.
              </p>
            </div>
          )}

        {messages.map(
          (message) => (
            <div
              key={message.id}
              className={`flex ${message.role ===
                "user"
                ? "justify-end"
                : "justify-start"
                }`}
            >
              <div
                className={`max-w-fit rounded-full px-6 py-3 text-[15px] ${message.role ===
                  "user"
                  ? "rounded-full border border-white/10 bg-[#111111] text-white"
                  : "bg-transparent text-foreground"
                  }`}
              >
                <p className="whitespace-pre-wrap">
                  {message.content ||
                    (message.isStreaming
                      ? "Thinking..."
                      : "")}
                </p>

                {message.sources &&
                  message.sources
                    .length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {message.sources.map(
                        (
                          source
                        ) => (
                          <SourceCard
                            key={
                              source.chunk_id
                            }
                            source={
                              source
                            }
                            onClick={() =>
                              onCitationClick(
                                source.page_number
                              )
                            }
                          />
                        )
                      )}
                    </div>
                  )}
              </div>
            </div>
          )
        )}

        <div
          ref={messagesEndRef}
        />
      </div>

      <div className="mt-4 border-t border-white/5 pt-4">
        <div className="flex items-center rounded-full border border-white/10 bg-[#111111] pl-4 pr-1.5">
          <textarea
            rows={1}
            value={question}
            onChange={(e) =>
              setQuestion(
                e.target.value
              )
            }
            placeholder="Ask a question"
            disabled={
              isStreaming
            }
            className="chat-input flex-1 resize-none bg-transparent px-0 py-[11px] text-[15px] leading-[1.2] text-foreground placeholder:text-muted-foreground outline-none"
          />

          <Button
            onClick={
              handleSend
            }
            disabled={
              isStreaming ||
              !question.trim()
            }
            size="icon"
            className="size-8 rounded-full bg-[#d9d9d9] text-black transition-colors hover:bg-white"
          >
            <Send
              className="size-4"
              aria-hidden
            />

            <span className="sr-only">
              Send
            </span>
          </Button>
        </div>

        {error && (
          <p className="mt-2 text-sm text-destructive">
            {error}
          </p>
        )}
      </div>


    </div>
  );
}
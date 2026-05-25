"use client";

import React, {
  useEffect,
  useRef,
  useState,
} from "react";

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
      <div className="flex-1 space-y-4 overflow-y-auto pr-2">
        {messages.length ===
          0 &&
          !isStreaming && (
            <div className="flex h-full min-h-[200px] flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center text-sm text-gray-500">
              <p className="font-medium text-gray-700">
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
              className={`flex ${
                message.role ===
                "user"
                  ? "justify-end"
                  : "justify-start"
              }`}
            >
              <div
                className={`
                max-w-[85%]
                rounded-2xl
                px-4
                py-3
                text-sm
                ${
                  message.role ===
                  "user"
                    ? "bg-black text-white"
                    : "bg-gray-100 text-black"
                }
              `}
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
                    <div className="mt-4 space-y-2">
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

      <div className="mt-4 border-t pt-4">
        <div className="flex gap-2">
          <textarea
            value={question}
            onChange={(e) =>
              setQuestion(
                e.target.value
              )
            }
            placeholder="Ask a question..."
            disabled={
              isStreaming
            }
            className="
              min-h-[60px]
              flex-1
              resize-none
              rounded-lg
              border
              p-3
              text-sm
              outline-none
              focus:ring-2
              focus:ring-black
            "
          />

          <Button
            onClick={
              handleSend
            }
            disabled={
              isStreaming ||
              !question.trim()
            }
          >
            Send
          </Button>
        </div>

        {error && (
          <p className="mt-2 text-sm text-red-500">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}

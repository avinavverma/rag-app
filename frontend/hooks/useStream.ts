"use client";

import { useRef, useState } from "react";

import { streamQuery } from "@/lib/api";

export function useStream() {
  const [isStreaming, setIsStreaming] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  const abortRef =
    useRef<AbortController | null>(null);

  async function send(
    question: string,
    documentId: string,
    userId: string,
    handlers: {
      onSources: (sources: any[]) => void;
      onToken: (token: string) => void;
      onDone: () => void;
    }
  ) {
    abortRef.current?.abort();

    const controller =
      new AbortController();

    abortRef.current = controller;

    setError(null);
    setIsStreaming(true);

    await streamQuery(
      question,
      documentId,
      userId,
      {
        onSources: handlers.onSources,

        onToken: handlers.onToken,

        onDone: () => {
          setIsStreaming(false);
          handlers.onDone();
        },

        onError: (err) => {
          setError(err.message);
          setIsStreaming(false);
        },
      },
      controller.signal
    );
  }

  function clearError() {
    setError(null);
  }

  return {
    send,
    isStreaming,
    error,
    clearError,
  };
}

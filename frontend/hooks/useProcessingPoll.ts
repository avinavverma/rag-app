"use client";

import { useEffect, useRef } from "react";
import type { Document } from "@/types";

const POLL_MS = 3000;

export function useProcessingPoll(
  documents: Document[],
  onRefresh: (silent?: boolean) => void | Promise<void>
) {
  const hasProcessing = documents.some(
    (d) => d.status === "processing"
  );
  const onRefreshRef = useRef(onRefresh);
  onRefreshRef.current = onRefresh;

  const intervalIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (!hasProcessing) {
      if (intervalIdRef.current !== null) {
        clearInterval(intervalIdRef.current);
        intervalIdRef.current = null;
      }
      return;
    }

    function startInterval() {
      if (intervalIdRef.current !== null) return;
      intervalIdRef.current = window.setInterval(() => {
        if (document.visibilityState === "visible") {
          void onRefreshRef.current?.(true);
        }
      }, POLL_MS);
    }

    function stopInterval() {
      if (intervalIdRef.current !== null) {
        clearInterval(intervalIdRef.current);
        intervalIdRef.current = null;
      }
    }

    function handleVisibilityChange() {
      if (document.visibilityState === "visible") {
        startInterval();
      } else {
        stopInterval();
      }
    }

    // start only if visible now
    if (typeof document !== "undefined" && document.visibilityState === "visible") {
      startInterval();
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      stopInterval();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [hasProcessing]);
}
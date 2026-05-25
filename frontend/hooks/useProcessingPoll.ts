"use client";

import { useEffect, useRef } from "react";
import type { Document } from "@/types";

const POLL_MS = 3000;

export function useProcessingPoll(
  documents: Document[],
  onRefresh: () => void | Promise<void>
) {
  const hasProcessing = documents.some(
    (d) => d.status === "processing"
  );
  const onRefreshRef = useRef(onRefresh);
  onRefreshRef.current = onRefresh;

  useEffect(() => {
    if (!hasProcessing) return;

    const id = setInterval(() => {
      void onRefreshRef.current();
    }, POLL_MS);

    return () => clearInterval(id);
  }, [hasProcessing]);
}
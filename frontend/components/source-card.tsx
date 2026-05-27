"use client";

import type { StreamSource } from "@/types";

interface SourceCardProps {
  source: StreamSource;
  onClick: () => void;
}

export function SourceCard({
  source,
  onClick,
}: SourceCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="
        inline-flex
        items-center
        gap-3
        rounded-full
        border
        border-white/10
        bg-[#0b0b0b]
        px-4
        py-2
        text-sm
        text-foreground/80
        transition-colors
        duration-150
        hover:bg-white/[0.04]
        hover:text-white
        focus:outline-none
      "
    >
      <span className="font-medium">
        Page {source.page_number}
      </span>

      <span className="text-foreground/40">
        {(source.similarity * 100).toFixed(0)}%
      </span>
    </button>
  );
}
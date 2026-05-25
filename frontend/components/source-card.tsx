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
        w-full
        rounded-lg
        border
        p-3
        text-left
        transition
        hover:bg-gray-50
        focus:outline-none
        focus:ring-2
        focus:ring-black
      "
    >
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm font-medium">
          Page {source.page_number}
        </span>

        <span className="text-xs text-gray-500">
          {(source.similarity * 100).toFixed(1)}%
        </span>
      </div>

      <p className="line-clamp-3 text-sm text-gray-700">
        {source.content}
      </p>
    </button>
  );
}

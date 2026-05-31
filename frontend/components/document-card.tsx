"use client";

import { useRouter } from "next/navigation";
import {
  MoreVertical,
  Trash2,
} from "lucide-react";
import {
  type KeyboardEvent,
  type MouseEvent,
  useState,
} from "react";

import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";

import type { Document } from "@/types";

interface DocumentCardProps {
  document: Document;
  onDelete: (document: Document) => void;
  deleting?: boolean;
}

export function DocumentCard({
  document,
  onDelete,
  deleting = false,
}: DocumentCardProps) {
  const router = useRouter();

  const [menuOpen, setMenuOpen] =
    useState(false);

  const formattedDate =
    new Date(
      document.created_at
    ).toLocaleDateString();

  function handleDeleteClick(
    event: MouseEvent<HTMLButtonElement>
  ) {
    event.preventDefault();
    event.stopPropagation();
    setMenuOpen(false);
    onDelete(document);
  }

  function openWorkspace() {
    router.push(
      `/workspace/${document.id}`
    );
  }

  function handleCardKeyDown(
    event: KeyboardEvent<HTMLDivElement>
  ) {
    if (
      event.key !== "Enter" &&
      event.key !== " "
    ) {
      return;
    }

    event.preventDefault();
    openWorkspace();
  }

  const menu = (
    <div className="relative">
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        aria-label={`Open actions for ${document.name}`}
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          setMenuOpen(
            (open) => !open
          );
        }}
      >
        <MoreVertical />
      </Button>

      {menuOpen && (
        <div className="absolute right-0 top-10 z-10 min-w-32 rounded-md border border-border bg-popover p-1 shadow-lg">
          <button
            type="button"
            disabled={deleting}
            onClick={
              handleDeleteClick
            }
            className="flex w-full items-center gap-2 rounded-sm px-3 py-2 text-left text-sm text-destructive hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Trash2 className="size-4" />
            {deleting
              ? "Deleting..."
              : "Delete"}
          </button>
        </div>
      )}
    </div>
  );

  const content = (
    <div className="flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1 pr-2">
          <h2 className="truncate text-lg font-semibold text-foreground">
            {document.name}
          </h2>
        </div>

        <StatusBadge
          status={
            document.status
          }
        />
      </div>

      <div className="min-w-0 space-y-2">
        {document.status ===
        "failed" ? (
          <p className="text-sm text-destructive">
            Upload failed. Try
            uploading again.
          </p>
        ) : document.status ===
          "processing" ? (
          <p className="text-sm text-[var(--status-processing-text)]">
            Processing...
          </p>
        ) : (
          <div className="space-y-1 text-sm text-muted-foreground">
            <p>
              {document.page_count ??
                "?"}{" "}
              pages
            </p>

            <p>{formattedDate}</p>
          </div>
        )}

        {document.status !==
          "ready" && (
          <p className="text-sm text-muted-foreground">
            {formattedDate}
          </p>
        )}
      </div>

      <div className="flex justify-end">
        {menu}
      </div>
    </div>
  );

  if (
    document.status !==
    "ready"
  ) {
    return (
      <div className="rounded-md border border-border bg-card p-4">
        {content}
      </div>
    );
  }

  return (
    <div
      role="link"
      tabIndex={0}
      onClick={openWorkspace}
      onKeyDown={handleCardKeyDown}
      className="block cursor-pointer rounded-md border border-border bg-card p-4 transition-[border-color,background-color,transform] duration-150 hover:border-accent/40 hover:bg-secondary/80 hover:-translate-y-[1px] focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none"
    >
      {content}
    </div>
  );
}

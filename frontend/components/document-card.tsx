  import Link from "next/link";

import { StatusBadge } from "@/components/status-badge";

import type { Document } from "@/types";

interface DocumentCardProps {
  document: Document;
}

export function DocumentCard({
  document,
}: DocumentCardProps) {
  const formattedDate =
    new Date(
      document.created_at
    ).toLocaleDateString();

  if (
    document.status ===
    "failed"
  ) {
    return (
      <div className="cursor-default rounded-md border border-border bg-card p-4 opacity-90">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <h2 className="break-words text-lg font-semibold text-foreground">
              {document.name}
            </h2>

            <p className="text-sm text-destructive">
              Upload failed.
              Try uploading
              again.
            </p>

            <p className="text-sm text-muted-foreground">
              {formattedDate}
            </p>
          </div>

          <StatusBadge
            status={
              document.status
            }
          />
        </div>
      </div>
    );
  }

  if (
    document.status ===
    "processing"
  ) {
    return (
      <div className="cursor-wait rounded-md border border-border bg-card p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <h2 className="break-words text-lg font-semibold text-foreground">
              {document.name}
            </h2>

            <p className="text-sm text-[var(--status-processing-text)]">
              Processing…
            </p>

            <p className="text-sm text-muted-foreground">
              {formattedDate}
            </p>
          </div>

          <StatusBadge
            status={
              document.status
            }
          />
        </div>
      </div>
    );
  }

  return (
    <Link
      href={`/workspace/${document.id}`}
      className="block rounded-md border border-border bg-card p-4 transition-[border-color,background-color,transform] duration-150 hover:border-accent/40 hover:bg-secondary/80 hover:-translate-y-[1px]"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <h2 className="break-words text-lg font-semibold text-foreground">
            {document.name}
          </h2>

          <div className="space-y-1 text-sm text-muted-foreground">
            <p>
              {document.page_count ??
                "?"}{" "}
              pages
            </p>

            <p>
              {formattedDate}
            </p>
          </div>
        </div>

        <StatusBadge
          status={
            document.status
          }
        />
      </div>
    </Link>
  );
}
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
      <div className="block rounded-lg border border-red-200 bg-red-50/50 p-4 opacity-90">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <h2 className="break-words font-semibold">
              {document.name}
            </h2>

            <p className="text-sm text-red-600">
              Upload failed.
              Try uploading
              again.
            </p>

            <p className="text-sm text-gray-500">
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
      <div className="block cursor-wait rounded-lg border bg-yellow-50/50 p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <h2 className="break-words font-semibold">
              {document.name}
            </h2>

            <p className="text-sm text-amber-700">
              Processing…
            </p>

            <p className="text-sm text-gray-500">
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
      className="block rounded-lg border p-4 transition hover:bg-gray-50"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <h2 className="break-words font-semibold">
            {document.name}
          </h2>

          <div className="space-y-1 text-sm text-gray-500">
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

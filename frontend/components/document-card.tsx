import Link from "next/link";

import { StatusBadge } from "@/components/status-badge";
import type { Document } from "@/types";

interface DocumentCardProps {
  document: Document;
}

export function DocumentCard({ document }: DocumentCardProps) {
  const formattedDate = new Date(
    document.created_at
  ).toLocaleDateString();

  return (
    <Link
      href={`/workspace/${document.id}`}
      className="block border rounded-lg p-4 hover:bg-gray-50 transition"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <h2 className="font-semibold break-words">
            {document.name}
          </h2>

          <div className="text-sm text-gray-500 space-y-1">
            <p>
              {document.page_count ?? "?"} pages
            </p>

            <p>
              {formattedDate}
            </p>
          </div>
        </div>

        <StatusBadge status={document.status} />
      </div>
    </Link>
  );
}

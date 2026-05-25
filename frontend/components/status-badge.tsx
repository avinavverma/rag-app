import type { DocumentStatus } from "@/types";

const styles: Record<DocumentStatus, string> = {
  processing: "bg-yellow-100 text-yellow-800",
  ready: "bg-green-100 text-green-800",
  failed: "bg-red-100 text-red-800",
};

interface StatusBadgeProps {
  status: DocumentStatus;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span
      className={`text-xs font-medium px-2 py-1 rounded-full ${styles[status]}`}
    >
      {status}
    </span>
  );
}

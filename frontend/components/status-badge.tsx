import type { DocumentStatus } from "@/types";

const styles: Record<
  DocumentStatus,
  string
> = {
  processing:
    "bg-[var(--status-processing-bg)] text-[var(--status-processing-text)]",

  ready:
    "bg-[var(--status-ready-bg)] text-[var(--status-ready-text)]",

  failed:
    "bg-[var(--status-failed-bg)] text-[var(--status-failed-text)]",
};

interface StatusBadgeProps {
  status: DocumentStatus;
}

export function StatusBadge({
  status,
}: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${styles[status]}`}
    >
      {status}
    </span>
  );
}
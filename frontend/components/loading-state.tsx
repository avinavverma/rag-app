import { Loader2 } from "lucide-react";

interface LoadingStateProps {
  label?: string;
  className?: string;
}

export function LoadingState({
  label = "Loading...",
  className = "",
}: LoadingStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-3 p-8 text-sm text-muted-foreground ${className}`}
      role="status"
      aria-live="polite"
    >
      <Loader2
        className="size-6 animate-spin text-muted-foreground"
        aria-hidden
      />

      <p>{label}</p>
    </div>
  );
}
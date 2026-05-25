import Link from "next/link";
import { Button } from "@/components/ui/button";

interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  backHref?: string;
  backLabel?: string;
}

export function ErrorState({
  title = "Something went wrong",
  message,
  onRetry,
  backHref = "/dashboard",
  backLabel = "Back to dashboard",
}: ErrorStateProps) {
  return (
    <div className="mx-auto max-w-md space-y-4 p-6 text-center">
      <h2 className="text-lg font-semibold text-red-600">{title}</h2>
      <p className="text-sm text-gray-600">{message}</p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        {onRetry && (
          <Button type="button" onClick={onRetry}>
            Try again
          </Button>
        )}
        <Link
          href={backHref}
          className="text-sm text-gray-500 underline hover:text-black"
        >
          {backLabel}
        </Link>
      </div>
    </div>
  );
}
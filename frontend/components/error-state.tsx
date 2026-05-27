import Link from "next/link";

import {
  AlertCircle,
  ArrowLeft,
} from "lucide-react";

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
      <div className="flex flex-col items-center gap-2">
        <AlertCircle
          className="size-6 text-destructive"
          aria-hidden
        />

        <h2 className="text-base font-semibold text-destructive">
          {title}
        </h2>
      </div>

      <p className="text-sm text-muted-foreground">
        {message}
      </p>

      <div className="flex flex-wrap items-center justify-center gap-3">
        {onRetry && (
          <Button
            type="button"
            onClick={onRetry}
          >
            Try again
          </Button>
        )}

        <Link
          href={backHref}
          className="inline-flex items-center text-sm text-muted-foreground underline transition-colors duration-150 hover:text-foreground"
        >
          <ArrowLeft
            className="mr-1 size-4"
            aria-hidden
          />

          {backLabel}
        </Link>
      </div>
    </div>
  );
}
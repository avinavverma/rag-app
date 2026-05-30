"use client";

import {
  useRef,
  useState,
} from "react";

import {
  Loader2,
  Upload,
} from "lucide-react";

import { uploadDocument } from "@/lib/api";

import { Button } from "@/components/ui/button";

interface UploadButtonProps {
  userId: string;

  onSuccess: () =>
    | Promise<void>
    | void;
}

export function UploadButton({
  userId,
  onSuccess,
}: UploadButtonProps) {
  const inputRef =
    useRef<HTMLInputElement | null>(
      null
    );

  const [uploading, setUploading] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  async function handleFileChange(
    e: React.ChangeEvent<HTMLInputElement>
  ) {
    const file =
      e.target.files?.[0];

    if (!file) return;

    setUploading(true);

    setError(null);

    try {
      await uploadDocument(
        file,
        file.name,
        userId
      );

      await onSuccess();
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Upload failed"
      );
    } finally {
      setUploading(false);

      if (inputRef.current) {
        inputRef.current.value =
          "";
      }
    }
  }

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf"
        className="hidden"
        onChange={
          handleFileChange
        }
      />

      <Button
        className="w-[170px]"
        disabled={uploading}
        onClick={() =>
          inputRef.current?.click()
        }
      >
        {uploading ? (
          <div className="flex items-center justify-center gap-2">
            <Loader2 className="size-4 animate-spin" />
            <span>Processing…</span>
          </div>
        ) : (
          <div className="flex items-center justify-center gap-2">
            <Upload className="size-4" />
            <span>Upload PDF</span>
          </div>
        )}
      </Button>

      <div className="absolute left-0 top-full mt-2 h-5 text-sm whitespace-nowrap">
        {uploading ? (
          <p className="text-muted-foreground">
            Uploading and processing…
          </p>
        ) : error ? (
          <div
            className="text-destructive"
            role="alert"
          >
            {error}

            <button
              type="button"
              className="ml-2 text-muted-foreground underline transition-colors duration-150 hover:text-foreground"
              onClick={() =>
                setError(null)
              }
            >
              Dismiss
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
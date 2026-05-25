"use client";

import {
  useRef,
  useState,
} from "react";

import { uploadDocument } from "@/lib/api";

import { LoadingState } from "@/components/loading-state";
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
    <div className="space-y-2">
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
        disabled={uploading}
        onClick={() =>
          inputRef.current?.click()
        }
      >
        {uploading
          ? "Processing PDF..."
          : "Upload PDF"}
      </Button>

      {uploading && (
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <LoadingState label="Uploading and processing…" />
        </div>
      )}

      {error && (
        <div
          className="text-sm text-red-600"
          role="alert"
        >
          {error}

          <button
            type="button"
            className="ml-2 underline"
            onClick={() =>
              setError(null)
            }
          >
            Dismiss
          </button>
        </div>
      )}
    </div>
  );
}

"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import { useRouter } from "next/navigation";

import {
  useUser,
  signOut,
} from "@/lib/auth";

import { fetchDocuments } from "@/lib/documents";

import { DocumentCard } from "@/components/document-card";
import { LoadingState } from "@/components/loading-state";
import { MarginLogo } from "@/components/margin-logo";
import { UploadButton } from "@/components/upload-button";
import { Button } from "@/components/ui/button";

import { useProcessingPoll } from "@/hooks/useProcessingPoll";

import type { Document } from "@/types";

export default function DashboardPage() {
  const {
    user,
    loading: authLoading,
  } = useUser();

  const router = useRouter();

  const [documents, setDocuments] =
    useState<Document[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  const loadDocuments = useCallback(
    async (silent = false) => {
      if (!silent) setLoading(true);
      setError(null);

      try {
        const docs = await fetchDocuments();
        setDocuments(docs);
      } catch (e) {
        setError(
          e instanceof Error ? e.message : "Failed to load documents"
        );
      } finally {
        if (!silent) setLoading(false);
      }
    },
    []
  );

  // poll uses a silent refresh so it doesn't show the global loading UI
  useProcessingPoll(documents, () => loadDocuments(true));

  useEffect(() => {
    if (user?.id || documents.length > 0) {
      loadDocuments();
    }
  }, [user?.id, loadDocuments]);

  async function handleSignOut() {
    await signOut();

    router.push("/login");
    router.refresh();
  }

  if (authLoading && !user) {
    return (
      <main className="min-h-screen">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
          <LoadingState label="Loading..." />
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-bg-base">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 space-y-6">
        <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-4">
            <div className="pb-1">
              <MarginLogo
                size="md"
                href="/dashboard"
              />
            </div>

            <div className="space-y-4">
              <h1 className="text-3xl font-semibold tracking-tight text-foreground">
                Dashboard
              </h1>

              <p className="mt-1 text-sm text-muted-foreground">
                Signed in as{" "}
                {user?.email}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {user && (
              <UploadButton
                userId={user.id}
                onSuccess={
                  loadDocuments
                }
              />
            )}

            <Button
              variant="outline"
              onClick={
                handleSignOut
              }
            >
              Sign out
            </Button>
          </div>
        </header>

        {documents.some(
          (d) =>
            d.status ===
            "processing"
        ) && (
            <p className="rounded-md border border-[var(--status-processing-bg)] bg-[var(--status-processing-bg)] px-3 py-2 text-sm text-[var(--status-processing-text)]">
              Processing document…
              list updates
              automatically.
            </p>
          )}

        {error && (
          <div className="text-sm text-[var(--destructive)]">
            {error}
          </div>
        )}

        {loading ? (
          <LoadingState label="Loading documents..." />
        ) : documents.length ===
          0 ? (
          <div className="rounded-md border border-border-default bg-bg-card/80 backdrop-blur-md p-8 text-center text-text-secondary">
            No documents yet.
            Upload a PDF.
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {documents.map(
              (document) => (
                <DocumentCard
                  key={
                    document.id
                  }
                  document={
                    document
                  }
                />
              )
            )}
          </div>
        )}
      </div>
    </main>
  );
}
"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";

import { PdfViewer } from "@/components/pdf-viewer";
import { ChatPanel } from "@/components/chat-panel";
import { LoadingState } from "@/components/loading-state";
import { ErrorState } from "@/components/error-state";

import { useUser } from "@/lib/auth";

import {
  fetchDocumentById,
  getDocumentPdfUrl,
} from "@/lib/documents";

import { fetchMessages } from "@/lib/messages";

import type {
  ChatMessage,
  Document,
} from "@/types";

const DOC_POLL_MS = 2500;

export function WorkspaceView() {
  const params = useParams();

  const docId =
    typeof params.docId === "string"
      ? params.docId
      : "";

  const {
    user,
    loading: authLoading,
  } = useUser();

  const [document, setDocument] =
    useState<Document | null>(null);

  const [pdfUrl, setPdfUrl] =
    useState<string | null>(null);

  const [pdfError, setPdfError] =
    useState<string | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  const [currentPage, setCurrentPage] =
    useState(1);

  const [messages, setMessages] =
    useState<ChatMessage[]>([]);

  const [messagesLoading, setMessagesLoading] =
    useState(false);

  const loadPdf = useCallback(
    async (filePath: string) => {
      setPdfError(null);

      try {
        const signedUrl =
          await getDocumentPdfUrl(
            filePath
          );

        setPdfUrl(signedUrl);
      } catch (e) {
        setPdfUrl(null);

        setPdfError(
          e instanceof Error
            ? e.message
            : "Failed to load PDF"
        );
      }
    },
    []
  );

  const loadWorkspace = useCallback(
    async () => {
      if (!docId) return;

      setLoading(true);
      setError(null);

      try {
        const doc =
          await fetchDocumentById(
            docId
          );

        if (!doc) {
          setError(
            "Document not found."
          );

          setDocument(null);

          return;
        }

        setDocument(doc);

        if (
          doc.status === "failed"
        ) {
          setError(
            "This document failed to process. Upload it again from the dashboard."
          );

          return;
        }

        if (
          doc.status ===
          "processing"
        ) {
          return;
        }

        if (!doc.file_path) {
          setError(
            "PDF file not found."
          );

          return;
        }

        await loadPdf(
          doc.file_path
        );
      } catch (e) {
        setError(
          e instanceof Error
            ? e.message
            : "Failed to load workspace"
        );
      } finally {
        setLoading(false);
      }
    },
    [docId, loadPdf]
  );

  useEffect(() => {
    if (docId) {
      void loadWorkspace();
    }
  }, [docId, loadWorkspace]);

  useEffect(() => {
    if (
      !docId ||
      document?.status !==
        "processing"
    ) {
      return;
    }

    const id = setInterval(
      async () => {
        const doc =
          await fetchDocumentById(
            docId
          );

        if (!doc) return;

        setDocument(doc);

        if (
          doc.status === "ready" &&
          doc.file_path
        ) {
          clearInterval(id);

          setLoading(true);

          await loadPdf(
            doc.file_path
          );

          setLoading(false);
        }

        if (
          doc.status === "failed"
        ) {
          clearInterval(id);

          setError(
            "Document processing failed."
          );
        }
      },
      DOC_POLL_MS
    );

    return () =>
      clearInterval(id);
  }, [
    docId,
    document?.status,
    loadPdf,
  ]);

  useEffect(() => {
    if (
      !docId ||
      document?.status !== "ready"
    ) {
      return;
    }

    async function loadHistory() {
      setMessagesLoading(true);

      try {
        const history =
          await fetchMessages(
            docId
          );

        setMessages(history);
      } catch (e) {
        console.error(
          "Failed to load messages",
          e
        );
      } finally {
        setMessagesLoading(false);
      }
    }

    void loadHistory();
  }, [docId, document?.status]);

  if (
    authLoading ||
    (loading && !document)
  ) {
    return (
      <main className="min-h-screen">
        <LoadingState label="Loading workspace..." />
      </main>
    );
  }

  if (
    error &&
    document?.status !==
      "processing"
  ) {
    return (
      <main className="min-h-screen">
        <ErrorState
          message={error}
          onRetry={() =>
            void loadWorkspace()
          }
        />
      </main>
    );
  }

  if (
    document?.status ===
    "processing"
  ) {
    return (
      <main className="min-h-screen">
        <LoadingState label="Processing document… This updates automatically." />

        <p className="pb-8 text-center text-sm text-gray-500">
          <Link
            href="/dashboard"
            className="underline"
          >
            Back to dashboard
          </Link>
        </p>
      </main>
    );
  }

  if (!document) {
    return (
      <main className="min-h-screen">
        <ErrorState message="Document unavailable." />
      </main>
    );
  }

  return (
    <main className="flex h-screen flex-col overflow-hidden">
      <header className="flex flex-col gap-2 border-b px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div>
          <Link
            href="/dashboard"
            className="text-sm text-gray-500 hover:underline"
          >
            ← Back to dashboard
          </Link>

          <h1 className="mt-1 text-lg font-semibold sm:text-xl">
            {document.name}
          </h1>
        </div>

        <div className="text-sm text-gray-500">
          Page {currentPage}
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden lg:flex-row">
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden border-b p-3 lg:w-1/2 lg:border-b-0 lg:border-r lg:p-4 max-lg:h-[45vh] max-lg:min-h-[280px] max-lg:flex-none">
          {pdfError ? (
            <ErrorState
              title="PDF failed to load"
              message={pdfError}
              onRetry={() =>
                document.file_path &&
                loadPdf(
                  document.file_path
                )
              }
              backHref="/dashboard"
            />
          ) : pdfUrl ? (
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
              <PdfViewer
                fileUrl={pdfUrl}
                pageNumber={
                  currentPage
                }
                onPageChange={
                  setCurrentPage
                }
              />
            </div>
          ) : (
            <LoadingState label="Loading PDF..." />
          )}
        </div>

        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden p-3 lg:w-1/2 lg:p-4">
          {messagesLoading ? (
            <LoadingState label="Loading conversation..." />
          ) : user ? (
            <ChatPanel
              documentId={
                document.id
              }
              userId={user.id}
              messages={messages}
              onMessagesChange={
                setMessages
              }
              onCitationClick={
                setCurrentPage
              }
            />
          ) : (
            <LoadingState label="Loading user..." />
          )}
        </div>
      </div>
    </main>
  );
}

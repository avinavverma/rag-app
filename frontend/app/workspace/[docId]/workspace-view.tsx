"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useState,
} from "react";

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
    typeof params.docId ===
      "string"
      ? params.docId
      : "";

  const {
    user,
    loading: authLoading,
  } = useUser();

  const [document, setDocument] =
    useState<Document | null>(
      null
    );

  const [pdfUrl, setPdfUrl] =
    useState<string | null>(
      null
    );

  const [pdfError, setPdfError] =
    useState<string | null>(
      null
    );

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(
      null
    );

  const [
    currentPage,
    setCurrentPage,
  ] = useState(1);

  const [messages, setMessages] =
    useState<ChatMessage[]>([]);

  const [
    messagesLoading,
    setMessagesLoading,
  ] = useState(false);

  const loadPdf = useCallback(
    async (
      filePath: string
    ) => {
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

  const loadWorkspace =
    useCallback(async () => {
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
          doc.status ===
          "failed"
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
    }, [docId, loadPdf]);

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
          doc.status ===
          "ready" &&
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
          doc.status ===
          "failed"
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
      document?.status !==
      "ready"
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
        setMessagesLoading(
          false
        );
      }
    }

    void loadHistory();
  }, [docId, document?.status]);

  if (
    authLoading ||
    (loading && !document)
  ) {
    return (
      <main className="min-h-screen bg-background">
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
      <main className="min-h-screen bg-background">
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
      <main className="min-h-screen bg-background">
        <LoadingState label="Processing document… This updates automatically." />

        <p className="pb-8 text-center text-sm text-muted-foreground">
          <Link
            href="/dashboard"
            className="text-muted-foreground underline transition-colors duration-150 hover:text-foreground"
          >
            Back to dashboard
          </Link>
        </p>
      </main>
    );
  }

  if (!document) {
    return (
      <main className="min-h-screen bg-background">
        <ErrorState message="Document unavailable." />
      </main>
    );
  }

  return (
    <main className="flex h-screen flex-col overflow-hidden bg-background">
      <header className="shrink-0 border-b border-border bg-background px-4 py-4 sm:px-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="flex size-9 items-center justify-center rounded-full border border-white/10 bg-[#111111] text-[#b3b3b3] transition-colors duration-150 hover:bg-[#1a1a1a] hover:text-white"
              aria-label="Back to dashboard"
            >
              <span className="-mt-[1px] ml-[1px] text-[17px] leading-none">
                ←
              </span>
            </Link>

            <h1 className="text-lg font-semibold text-foreground sm:text-xl">
              {document.name}
            </h1>
          </div>

          <div className="text-sm text-muted-foreground">
            Page {currentPage}
          </div>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden lg:flex-row">
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden border-b border-border p-3 lg:w-[60%] lg:flex-none lg:border-b-0 lg:border-r lg:border-border lg:p-4 max-lg:h-[45vh] max-lg:min-h-[280px] max-lg:flex-none">
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

        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden p-3 lg:w-[40%] lg:flex-none lg:p-4">
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
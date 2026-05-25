"use client";

import Link from "next/link";

import {
  useEffect,
  useState,
} from "react";

import { useParams } from "next/navigation";

import { PdfViewer } from "@/components/pdf-viewer";

import { ChatPanel } from "@/components/chat-panel";

import { useUser } from "@/lib/auth";

import {
  fetchDocumentById,
  getDocumentPdfUrl,
} from "@/lib/documents";

import type {
  ChatMessage,
  Document,
} from "@/types";

export function WorkspaceView() {
  const params = useParams();

  const docId = params.docId as string;

  const {
    user,
    loading: authLoading,
  } = useUser();

  const [document, setDocument] =
    useState<Document | null>(null);

  const [pdfUrl, setPdfUrl] =
    useState<string | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  const [currentPage, setCurrentPage] =
    useState(1);

  const [messages, setMessages] =
    useState<ChatMessage[]>([]);

  useEffect(() => {
    async function loadWorkspace() {
      try {
        setLoading(true);
        setError(null);

        const doc =
          await fetchDocumentById(
            docId
          );

        if (!doc) {
          throw new Error(
            "Document not found"
          );
        }

        if (doc.status !== "ready") {
          throw new Error(
            "Document is still processing or failed."
          );
        }

        if (!doc.file_path) {
          throw new Error(
            "PDF file not found."
          );
        }

        const signedUrl =
          await getDocumentPdfUrl(
            doc.file_path
          );

        setDocument(doc);

        setPdfUrl(signedUrl);
      } catch (e) {
        setError(
          e instanceof Error
            ? e.message
            : "Failed to load workspace"
        );
      } finally {
        setLoading(false);
      }
    }

    if (docId) {
      loadWorkspace();
    }
  }, [docId]);

  if (authLoading || loading) {
    return (
      <main className="p-6">
        <p>Loading workspace...</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="p-6">
        <p className="text-red-500">
          {error}
        </p>
      </main>
    );
  }

  if (!document || !pdfUrl) {
    return (
      <main className="p-6">
        <p>
          Failed to load document.
        </p>
      </main>
    );
  }

  return (
    <main className="flex h-screen flex-col">
      <header className="flex items-center justify-between border-b px-6 py-4">
        <div>
          <Link
            href="/dashboard"
            className="text-sm text-gray-500 hover:underline"
          >
            ← Back to dashboard
          </Link>

          <h1 className="mt-1 text-xl font-semibold">
            {document.name}
          </h1>
        </div>

        <div className="text-sm text-gray-500">
          Page {currentPage}
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <div className="w-1/2 border-r p-4">
          <PdfViewer
            fileUrl={pdfUrl}
            pageNumber={currentPage}
            onPageChange={
              setCurrentPage
            }
          />
        </div>

        <div className="w-1/2 p-4">
          {user ? (
            <ChatPanel
              documentId={document.id}
              userId={user.id}
              messages={messages}
              onMessagesChange={
                setMessages
              }
              onCitationClick={(
                page
              ) =>
                setCurrentPage(page)
              }
            />
          ) : (
            <p className="text-sm text-gray-500">
              Loading user...
            </p>
          )}
        </div>
      </div>
    </main>
  );
}

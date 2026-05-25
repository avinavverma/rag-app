"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import { PdfViewer } from "@/components/pdf-viewer";

import { useUser } from "@/lib/auth";
import {
  fetchDocumentById,
  getDocumentPdfUrl,
} from "@/lib/documents";

import type { Document } from "@/types";

export function WorkspaceView() {
  const params = useParams();

  const docId =
    typeof params.docId === "string"
      ? params.docId
      : "";

  const { user, loading: authLoading } = useUser();

  const [document, setDocument] =
    useState<Document | null>(null);

  const [pdfUrl, setPdfUrl] =
    useState<string | null>(null);

  const [currentPage, setCurrentPage] =
    useState(1);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  useEffect(() => {
    if (!user || !docId) return;

    async function loadWorkspace() {
      setLoading(true);
      setError(null);

      try {
        const doc =
          await fetchDocumentById(docId);

        if (!doc) {
          setError("Document not found.");
          return;
        }

        if (doc.status !== "ready") {
          setError(
            "Document is still processing or failed."
          );
          return;
        }

        if (!doc.file_path) {
          setError("PDF file not found.");
          return;
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

    loadWorkspace();
  }, [user, docId]);

  if (authLoading || loading) {
    return (
      <main className="p-6">
        <p>Loading document...</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="p-6 space-y-4">
        <Link
          href="/dashboard"
          className="text-sm underline"
        >
          ← Back to dashboard
        </Link>

        <p className="text-red-500">
          {error}
        </p>
      </main>
    );
  }

  if (!document || !pdfUrl) {
    return (
      <main className="p-6">
        <p>Document unavailable.</p>
      </main>
    );
  }

  return (
    <main className="h-screen flex flex-col">
      <header className="border-b px-6 py-4 flex items-center justify-between">
        <div className="space-y-1">
          <Link
            href="/dashboard"
            className="text-sm underline"
          >
            ← Back to dashboard
          </Link>

          <h1 className="text-2xl font-bold">
            {document.name}
          </h1>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <div className="w-1/2 border-r p-4">
          <PdfViewer
            fileUrl={pdfUrl}
            pageNumber={currentPage}
            onPageChange={setCurrentPage}
          />
        </div>

        <div className="w-1/2 p-4 text-gray-500">
          <div className="border rounded-lg h-full p-6">
            Chat panel — Segment 9
          </div>
        </div>
      </div>
    </main>
  );
}

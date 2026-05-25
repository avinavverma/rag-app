"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { useUser, signOut } from "@/lib/auth";
import { fetchDocuments } from "@/lib/documents";

import { DocumentCard } from "@/components/document-card";
import { UploadButton } from "@/components/upload-button";
import { Button } from "@/components/ui/button";

import type { Document } from "@/types";

export default function DashboardPage() {
  const { user, loading: authLoading } = useUser();

  const router = useRouter();

  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDocuments = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const docs = await fetchDocuments();

      setDocuments(docs);
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Failed to load documents"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) {
      loadDocuments();
    }
  }, [user, loadDocuments]);

  async function handleSignOut() {
    await signOut();

    router.push("/login");
    router.refresh();
  }

  if (authLoading) {
    return (
      <main className="p-6">
        <p>Loading...</p>
      </main>
    );
  }

  return (
    <main className="p-6 space-y-6">
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold">
            Dashboard
          </h1>

          <p className="text-sm text-gray-500">
            Signed in as {user?.email}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {user && (
            <UploadButton
              userId={user.id}
              onSuccess={loadDocuments}
            />
          )}

          <Button
            variant="outline"
            onClick={handleSignOut}
          >
            Sign out
          </Button>
        </div>
      </header>

      <div className="text-sm text-gray-500 break-all">
        User ID: {user?.id}
      </div>

      {error && (
        <div className="text-sm text-red-500">
          {error}
        </div>
      )}

      {loading ? (
        <p>Loading documents...</p>
      ) : documents.length === 0 ? (
        <div className="border rounded-lg p-8 text-center text-gray-500">
          No documents yet. Upload a PDF.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {documents.map((document) => (
            <DocumentCard
              key={document.id}
              document={document}
            />
          ))}
        </div>
      )}
    </main>
  );
}


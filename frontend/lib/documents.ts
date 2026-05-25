import { createClient } from "@/lib/supabase/client";
import type { Document } from "@/types";

export async function fetchDocuments(): Promise<Document[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("documents")
    .select("id, name, status, page_count, file_path, created_at")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function fetchDocumentById(id: string): Promise<Document | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("documents")
    .select("id, name, status, page_count, file_path, created_at")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

export async function getDocumentPdfUrl(filePath: string): Promise<string> {
  const supabase = createClient();
  const { data, error } = await supabase.storage
    .from("pdfs")
    .createSignedUrl(filePath, 60 * 60); // 1 hour
  if (error) throw new Error(error.message);
  if (!data?.signedUrl) throw new Error("Failed to create signed URL");
  return data.signedUrl;
}
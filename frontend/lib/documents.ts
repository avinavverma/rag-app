import { createClient } from "@/lib/supabase/client";
import type { Document } from "@/types";

export async function fetchDocuments(): Promise<Document[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("documents")
    .select("id, name, status, page_count, created_at")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data ?? [];
}
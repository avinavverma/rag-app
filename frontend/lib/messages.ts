import { createClient } from "@/lib/supabase/client";
import type { ChatMessage, DbMessage, StreamSource } from "@/types";

function dbToChatMessage(row: DbMessage): ChatMessage {
  return {
    id: row.id,
    role: row.role,
    content: row.content,
    sources: row.sources ?? undefined,
    isStreaming: false,
  };
}

export async function fetchMessages(
  documentId: string
): Promise<ChatMessage[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("messages")
    .select("id, role, content, sources, created_at")
    .eq("document_id", documentId)
    .order("created_at", { ascending: true });

  if (error) throw new Error(error.message);

  return (data ?? []).map((row) =>
    dbToChatMessage(row as DbMessage)
  );
}
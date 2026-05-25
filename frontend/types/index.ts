export type DocumentStatus = "processing" | "ready" | "failed";

export interface Document {
  id: string;
  name: string;
  status: DocumentStatus;
  page_count: number | null;
  created_at: string;
}

export interface UploadResponse {
  document_id: string;
  status: "processing" | "ready";
}

export interface Document {
  id: string;
  name: string;
  status: DocumentStatus;
  page_count: number | null;
  file_path: string | null;
  created_at: string;
}

export interface StreamSource {
  chunk_id: string;
  page_number: number;
  content: string;      // preview from backend
  similarity: number;
}

export type ChatRole = "user" | "assistant";

export interface ChatMessage {
  id: string;           // client uuid (crypto.randomUUID())
  role: ChatRole;
  content: string;
  sources?: StreamSource[];
  isStreaming?: boolean; // assistant only
}
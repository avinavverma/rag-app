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
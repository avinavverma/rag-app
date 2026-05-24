import type { UploadResponse } from "@/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL!;

export async function uploadDocument(
  file: File,
  name: string,
  userId: string
): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("name", name);

  const response = await fetch(`${API_URL}/ingest/upload`, {
    method: "POST",
    headers: {
      "x-user-id": userId,
    },
    body: formData,
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.detail ?? `Upload failed (${response.status})`);
  }

  return response.json();
}
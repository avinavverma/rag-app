import type { UploadResponse } from "@/types";

import type {
  StreamSource
} from "@/types";

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

export async function deleteDocument(
  documentId: string,
  userId: string
): Promise<void> {
  const response = await fetch(
    `${API_URL}/documents/${documentId}`,
    {
      method: "DELETE",
      headers: {
        "x-user-id": userId,
      },
    }
  );

  if (!response.ok) {
    const body = await response
      .json()
      .catch(() => ({}));

    throw new Error(
      body.detail ??
        `Delete failed (${response.status})`
    );
  }
}

export async function streamQuery(
  question: string,
  documentId: string,
  userId: string,
  handlers: {
    onSources: (sources: StreamSource[]) => void;
    onToken: (token: string) => void;
    onDone: () => void;
    onError: (err: Error) => void;
  },
  signal?: AbortSignal
): Promise<void> {
  try {
    const response = await fetch(
      `${API_URL}/query/stream`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": userId,
        },
        body: JSON.stringify({
          question,
          document_id: documentId,
        }),
        signal,
      }
    );

    if (!response.ok) {
      const body = await response
        .json()
        .catch(() => ({}));

      throw new Error(
        body.detail ??
          `Stream failed (${response.status})`
      );
    }

    if (!response.body) {
      throw new Error("Missing response body");
    }

    const reader = response.body.getReader();

    const decoder = new TextDecoder();

    let buffer = "";

    let gotDone = false;

    while (true) {
      const { done, value } =
        await reader.read();

      if (done) break;

      buffer += decoder.decode(value, {
        stream: true,
      });

      const events = buffer.split("\n\n");

      buffer = events.pop() ?? "";

      for (const event of events) {
        const line = event
          .split("\n")
          .find((l) =>
            l.startsWith("data:")
          );

        if (!line) continue;

        const json = line.replace(
          /^data:\s*/,
          ""
        );

        try {
          const parsed = JSON.parse(json);

          switch (parsed.type) {
            case "sources":
              handlers.onSources(
                parsed.sources ?? []
              );
              break;

            case "token":
              handlers.onToken(
                parsed.token ?? ""
              );
              break;

            case "done":
              gotDone = true;
              handlers.onDone();
              break;

            default:
              break;
          }
        } catch {
          // ignore malformed chunks
        }
      }
    }

    if (!gotDone) {
      throw new Error(
        "Stream ended before done event"
      );
    }
  } catch (e) {
    const err =
      e instanceof Error
        ? e
        : new Error("Unknown stream error");

    handlers.onError(err);
  }
}

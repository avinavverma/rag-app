"use client";

import dynamic from "next/dynamic";

export const PdfViewer = dynamic(
  () =>
    import("./pdf-viewer-client").then(
      (mod) => mod.PdfViewer
    ),
  {
    ssr: false,
  }
);

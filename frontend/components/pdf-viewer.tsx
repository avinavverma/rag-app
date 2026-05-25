"use client";

import { useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import { Button } from "@/components/ui/button";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

interface PdfViewerProps {
  fileUrl: string;
  pageNumber: number;
  onPageChange: (page: number) => void;
}

export function PdfViewer({ fileUrl, pageNumber, onPageChange }: PdfViewerProps) {
  const [numPages, setNumPages] = useState<number | null>(null);

  return (
    <div className="flex flex-col h-full">
      {/* toolbar: Previous | Page X of Y | Next */}
      <div className="flex-1 overflow-auto border rounded-lg bg-gray-50 flex justify-center p-4">
        <Document
          file={fileUrl}
          onLoadSuccess={({ numPages }) => setNumPages(numPages)}
          loading={<p>Loading PDF...</p>}
          error={<p>Failed to load PDF.</p>}
        >
          <Page pageNumber={pageNumber} width={600} />
        </Document>
      </div>
    </div>
  );
}
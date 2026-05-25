"use client";

import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  Document,
  Page,
  pdfjs,
} from "react-pdf";

import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

interface PdfViewerProps {
  fileUrl: string;
  pageNumber: number;
  onPageChange: (
    page: number
  ) => void;
}

const LOCAL_WORKER =
  "/pdf.worker.min.mjs";

const CDN_WORKER =
  "https://unpkg.com/pdfjs-dist@4.4.168/build/pdf.worker.min.mjs";

async function probeUrl(
  url: string
): Promise<boolean> {
  try {
    const res = await fetch(url, {
      method: "HEAD",
      cache: "no-store",
    });

    return (
      res &&
      (res.ok || res.type === "opaque")
    );
  } catch {
    return false;
  }
}

export function PdfViewer({
  fileUrl,
  pageNumber,
  onPageChange,
}: PdfViewerProps) {
  const [numPages, setNumPages] =
    useState<number | null>(null);

  const [pageWidth, setPageWidth] =
    useState<number>(600);

  const [workerUrl, setWorkerUrl] =
    useState<string | null>(null);

  const [workerStamp, setWorkerStamp] =
    useState<number>(0);

  const scrollContainerRef =
    useRef<HTMLDivElement | null>(
      null
    );

  useEffect(() => {
    function handleResize() {
      const w = Math.min(
        window.innerWidth * 0.4,
        700
      );

      setPageWidth(w);
    }

    handleResize();

    window.addEventListener(
      "resize",
      handleResize
    );

    return () =>
      window.removeEventListener(
        "resize",
        handleResize
      );
  }, []);

  useEffect(() => {
    let mounted = true;

    (async () => {
      if (
        typeof window ===
        "undefined"
      ) {
        return;
      }

      if (
        await probeUrl(LOCAL_WORKER)
      ) {
        if (!mounted) return;

        const stamp = Date.now();

        pdfjs.GlobalWorkerOptions.workerSrc =
          `${LOCAL_WORKER}?t=${stamp}`;

        setWorkerUrl(
          LOCAL_WORKER
        );

        setWorkerStamp(stamp);

        return;
      }

      if (
        await probeUrl(CDN_WORKER)
      ) {
        if (!mounted) return;

        const stamp = Date.now();

        pdfjs.GlobalWorkerOptions.workerSrc =
          `${CDN_WORKER}?t=${stamp}`;

        setWorkerUrl(
          CDN_WORKER
        );

        setWorkerStamp(stamp);

        return;
      }

      const stamp = Date.now();

      pdfjs.GlobalWorkerOptions.workerSrc =
        `${CDN_WORKER}?t=${stamp}`;

      setWorkerUrl(CDN_WORKER);

      setWorkerStamp(stamp);
    })();

    return () => {
      mounted = false;

      setWorkerUrl(null);

      setWorkerStamp(0);
    };
  }, []);

  useEffect(() => {
    const container =
      scrollContainerRef.current;

    if (!container) {
      return;
    }

    const pageElement =
      container.querySelector(
        `[data-page-number="${pageNumber}"]`
      ) as HTMLElement | null;

    if (!pageElement) {
      return;
    }

    const top =
      pageElement.offsetTop -
      container.offsetTop;

    container.scrollTo({
      top,
      behavior: "smooth",
    });
  }, [pageNumber]);

  if (!workerUrl) {
    return (
      <div className="flex flex-1 items-center justify-center p-4">
        Initializing PDF
        worker...
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div
        ref={
          scrollContainerRef
        }
        className="min-h-0 flex-1 overflow-auto rounded-lg border bg-gray-50 p-4"
      >
        <Document
          key={`${fileUrl}:${workerStamp}`}
          file={fileUrl}
          onLoadSuccess={({
            numPages,
          }) =>
            setNumPages(
              numPages
            )
          }
          loading={
            <p>
              Loading PDF...
            </p>
          }
          error={
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              Failed to load
              PDF. The link
              may have
              expired —
              refresh the
              page.
            </div>
          }
        >
          {numPages ? (
            Array.from({
              length: numPages,
            }).map((_, i) => (
              <div
                key={i}
                data-page-number={
                  i + 1
                }
                className="mb-6 flex justify-center"
              >
                <Page
                  pageNumber={
                    i + 1
                  }
                  width={
                    pageWidth
                  }
                  renderTextLayer={
                    false
                  }
                />
              </div>
            ))
          ) : (
            <Page
              pageNumber={
                pageNumber
              }
              width={pageWidth}
              renderTextLayer={
                false
              }
            />
          )}
        </Document>
      </div>
    </div>
  );
}

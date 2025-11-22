// CompressPDF.jsx
import { useCallback, useEffect, useRef, useState } from "react";
import { PDFDocument } from "pdf-lib";
import { motion, AnimatePresence } from "framer-motion";
import { CloudUpload, DownloadCloud, Loader, Trash2, AlertCircle } from "lucide-react";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf";

// Configure pdfjs worker (uses CDN)
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

/**
 * Single-file, production-ready React component that:
 * - reads a user-uploaded PDF
 * - optionally shows page count
 * - compresses by rasterizing each page (pdfjs -> canvas -> jpeg)
 * - builds a new PDF from JPEGs using pdf-lib
 *
 * Tradeoffs: rasterizes pages (loses selectable/searchable text), but provides
 * significant size savings for image-heavy PDFs.
 */

const humanSize = (bytes) => {
  if (!bytes && bytes !== 0) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

const isPdfFile = (file) => {
  if (!file) return false;
  if (file.type === "application/pdf") return true;
  return file.name?.toLowerCase().endsWith(".pdf");
};

const CompressPDF = () => {
  const [file, setFile] = useState(null);
  const [pages, setPages] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState("");
  const [error, setError] = useState("");
  const [resultUrl, setResultUrl] = useState(null);
  const [resultSize, setResultSize] = useState(null);
  const [originalSize, setOriginalSize] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [pageProgress, setPageProgress] = useState({ current: 0, total: 0 }); // per-page progress
  const inputRef = useRef(null);

  useEffect(() => {
    return () => {
      if (resultUrl) URL.revokeObjectURL(resultUrl);
    };
  }, [resultUrl]);

  const handleFileSet = (f) => {
    setError("");
    setResultUrl(null);
    setResultSize(null);
    setPages(null);
    setPageProgress({ current: 0, total: 0 });
    if (!isPdfFile(f)) {
      setError("Only PDF files are supported.");
      return false;
    }
    if (f.size === 0) {
      setError("Selected file is empty.");
      return false;
    }
    setFile(f);
    setOriginalSize(f.size);
    return true;
  };

  const readPdf = async (f) => {
    try {
      setProgress("Reading PDF...");
      const arrayBuffer = await f.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
      setPages(pdfDoc.getPageCount());
      setProgress("");
    } catch (err) {
      console.error("readPdf error:", err);
      setError("Failed to read PDF file. The file may be corrupted or unsupported.");
      setProgress("");
    }
  };

  // Drag & Drop handlers
  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const files = e.dataTransfer?.files;
    if (files && files.length > 0) {
      const f = files[0];
      console.log("Dropped file:", f.name, f.type, f.size);
      const ok = handleFileSet(f);
      if (ok) {
        readPdf(f);
      }
    }
  };

  // File input handler
  const onFileInputChange = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    console.log("Input file selected:", f.name, f.type, f.size);
    const ok = handleFileSet(f);
    if (ok) {
      readPdf(f);
    }
  };

  const reset = () => {
    setFile(null);
    setPages(null);
    setResultUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    setResultSize(null);
    setIsProcessing(false);
    setProgress("");
    setError("");
    setOriginalSize(null);
    setPageProgress({ current: 0, total: 0 });
    if (inputRef.current) inputRef.current.value = "";
  };

  // Helper: convert dataURL (base64) to Uint8Array
  const dataURLToUint8Array = (dataURL) => {
    const base64 = dataURL.split(",")[1];
    const binary = atob(base64);
    const len = binary.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i);
    return bytes;
  };

  /**
   * compressViaCanvas:
   * - rasterizes each page using pdfjs-dist at reduced scale (maxWidth)
   * - converts canvas to JPEG with given quality
   * - embeds JPEGs into a new pdf-lib document
   *
   * options:
   * - quality: 0.4 - 0.85 (lower => smaller file)
   * - maxWidth: max pixel width for page render; scales down large pages
   */
  const compressViaCanvas = async (fileObj, { quality = 0.6, maxWidth = 1400 } = {}) => {
    // load with pdfjs
    const arrayBuffer = await fileObj.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;

    setPageProgress({ current: 0, total: pdf.numPages });

    const outPdf = await PDFDocument.create();

    for (let p = 1; p <= pdf.numPages; ++p) {
      setProgress(`Rendering page ${p}/${pdf.numPages}...`);
      setPageProgress({ current: p, total: pdf.numPages });

      const page = await pdf.getPage(p);
      const viewport = page.getViewport({ scale: 1 });

      // determine scale to limit width
      const scale = Math.min(1, maxWidth / viewport.width);
      const scaledViewport = page.getViewport({ scale });

      // create canvas
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(scaledViewport.width);
      canvas.height = Math.round(scaledViewport.height);
      const ctx = canvas.getContext("2d");

      // render
      const renderContext = {
        canvasContext: ctx,
        viewport: scaledViewport,
      };

      await page.render(renderContext).promise;

      // convert to JPEG dataURL
      const jpegDataUrl = canvas.toDataURL("image/jpeg", quality);
      const bytes = dataURLToUint8Array(jpegDataUrl);

      // embed into output PDF
      const embeddedImage = await outPdf.embedJpg(bytes);
      const { width: imgW, height: imgH } = embeddedImage.scale(1);

      const newPage = outPdf.addPage([imgW, imgH]);
      newPage.drawImage(embeddedImage, {
        x: 0,
        y: 0,
        width: imgW,
        height: imgH,
      });

      // free canvas memory
      canvas.width = 0;
      canvas.height = 0;
    }

    setProgress("Finalizing...");
    const outBytes = await outPdf.save();
    const outBlob = new Blob([outBytes], { type: "application/pdf" });
    return outBlob;
  };

  const compress = useCallback(async () => {
    setError("");
    if (!file) {
      setError("Please upload a PDF first.");
      return;
    }

    setIsProcessing(true);
    setProgress("Starting compression...");
    setResultUrl(null);
    setResultSize(null);
    setPageProgress({ current: 0, total: 0 });

    try {
      // Tweak quality & maxWidth to balance size vs quality
      const quality = 0.6; // 0.4 - 0.85
      const maxWidth = 1400; // pixels

      // Perform canvas-based compression
      const outBlob = await compressViaCanvas(file, { quality, maxWidth });

      const url = URL.createObjectURL(outBlob);
      setResultUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return url;
      });
      setResultSize(outBlob.size);
      setProgress("Completed");
      console.log("Original size:", originalSize, "Compressed size:", outBlob.size);
    } catch (err) {
      console.error("compress error:", err);
      setError("Compression failed. Try a different PDF or use server-side tools for heavier compression.");
    } finally {
      setIsProcessing(false);
      setTimeout(() => {
        setProgress("");
        setPageProgress({ current: 0, total: 0 });
      }, 1200);
    }
  }, [file, originalSize]);

  const compressionPercent = originalSize && resultSize
    ? ((1 - resultSize / originalSize) * 100).toFixed(1)
    : 0;

  return (
    <div className="max-w-3xl mx-auto mt-10 p-6 bg-white rounded-xl shadow-md border border-gray-200">
      <motion.h2
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-2xl font-bold mb-2"
      >
        Compress PDF
      </motion.h2>
      <p className="text-sm text-gray-600 mb-4">
        Client-side raster compression (pdfjs + pdf-lib). This converts pages to images and rebuilds the PDF.
      </p>

      <div
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`rounded-lg p-6 border-2 text-center transition cursor-pointer ${
          dragActive
            ? "border-sky-500 bg-sky-50"
            : "border-dashed border-gray-300 bg-gray-50 hover:border-sky-300"
        }`}
        role="button"
        tabIndex={0}
        aria-label="Drop PDF here or click to upload"
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,application/pdf"
          onChange={onFileInputChange}
          className="hidden"
        />
        <CloudUpload className="mx-auto text-sky-500 w-8 h-8" />
        <div className="mt-2 text-sm text-gray-700">
          {file ? file.name : "Drag & drop a PDF here, or click to browse"}
        </div>
        <div className="text-xs text-gray-400 mt-1">
          {file ? `${humanSize(file.size)} • ${pages ?? "..."} page(s)` : "Supported: PDF"}
        </div>
      </div>

      <div className="mt-4 flex gap-3 items-center">
        <button
          onClick={compress}
          disabled={!file || isProcessing}
          className={`flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 rounded bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-60`}
        >
          {isProcessing ? (
            <>
              <Loader className="animate-spin" /> Processing...
            </>
          ) : (
            "Optimize PDF"
          )}
        </button>

        <button
          onClick={reset}
          className="px-4 py-2 rounded bg-gray-100 hover:bg-gray-200 inline-flex items-center gap-2"
        >
          <Trash2 /> Reset
        </button>

        {resultUrl && (
          <a
            href={resultUrl}
            download={`optimized-${file?.name || "file"}`}
            className="inline-flex items-center gap-2 px-4 py-2 rounded bg-emerald-600 text-white hover:bg-emerald-700"
          >
            <DownloadCloud /> Download
          </a>
        )}
      </div>

      <AnimatePresence>
        {progress && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="mt-4 text-sm text-gray-600"
          >
            {progress}
            {pageProgress.total > 0 && (
              <div className="mt-1 text-xs text-gray-500">
                Page {pageProgress.current} of {pageProgress.total}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="mt-4 bg-red-50 border border-red-200 p-3 rounded text-sm text-red-700 flex items-start gap-2"
          >
            <AlertCircle className="flex-shrink-0 mt-0.5" />
            <div>{error}</div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-gray-600">
        <div className="bg-gray-50 p-3 rounded border">
          <div className="font-medium">Original Size</div>
          <div className="mt-1 text-lg font-semibold text-gray-800">
            {originalSize ? humanSize(originalSize) : "-"}
          </div>
        </div>
        <div className="bg-gray-50 p-3 rounded border">
          <div className="font-medium">Compressed Size</div>
          <div className="mt-1">
            {resultSize ? (
              <div>
                <div className="text-lg font-semibold text-emerald-600">
                  {humanSize(resultSize)}
                </div>
                <div className="text-xs text-gray-500">Reduced by {compressionPercent}%</div>
              </div>
            ) : (
              "-"
            )}
          </div>
        </div>
      </div>

      <div className="mt-4 text-xs text-gray-500">
        Note: This client-side method rasterizes pages (text will no longer be selectable). For
        searchable PDFs or better quality preservation use server-side tools like Ghostscript.
      </div>
    </div>
  );
};

export default CompressPDF;
